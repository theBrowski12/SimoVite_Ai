package cf.delivery_service.service;

import cf.delivery_service.dto.CourierLocationRequest;
import cf.delivery_service.dto.DeliveryResponseDto;
import cf.delivery_service.dto.DistancePreviewDto;
import cf.delivery_service.dto.ETA.ETARequest;
import cf.delivery_service.dto.ETA.ETAResponse;
import cf.delivery_service.dto.StoreResponseDto;
import cf.delivery_service.entity.Address;
import cf.delivery_service.entity.CourierLocation;
import cf.delivery_service.entity.Delivery;
import cf.delivery_service.enums.DeliveryStatus;
import cf.delivery_service.enums.VehicleType;
import cf.delivery_service.feignClient.ETAFeignClient;
import cf.delivery_service.feignClient.OrderClient;
import cf.delivery_service.feignClient.PriceFeignClient;
import cf.delivery_service.feignClient.StoreClient;
import cf.delivery_service.kafkaEvents.DeliveryNotificationEvent;
import cf.delivery_service.kafkaEvents.OrderPaidEvent;
import cf.delivery_service.mapper.DeliveryMapper;
import cf.delivery_service.repository.CourierLocationRepository;
import cf.delivery_service.repository.DeliveryRepository;
import cf.delivery_service.service.DeliveryService;
import cf.delivery_service.utils.DistanceCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static cf.delivery_service.enums.OrderStatus.ACCEPTED;
import static cf.delivery_service.enums.OrderStatus.COMPLETED;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryServiceImpl implements DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryMapper deliveryMapper;
    private final OrderClient orderClient;
    private final KafkaProducerService kafkaProducerService;
    private final StoreClient storeClient;
    private final ETAFeignClient etaFeignClient;
    private final CourierLocationRepository courierLocationRepository;
    @Override
    public List<DeliveryResponseDto> getPendingDeliveries() {
        log.info("Récupération des livraisons en attente...");
        List<Delivery> deliveries = deliveryRepository.findByStatus(DeliveryStatus.PENDING);

        // On convertit la liste d'entités en liste de DTOs
        return deliveries.stream()
                .map(deliveryMapper::toDto)
                .collect(Collectors.toList());
    }
    @Transactional
    public void createDeliveryFromOrder(OrderPaidEvent event) {

        // 1. Récupérer les infos du magasin (Point de retrait)
        StoreResponseDto store = storeClient.getStoreById(event.getStoreId());
        if (store == null || store.getAddress() == null) {
            throw new RuntimeException("Impossible de trouver le magasin ou son adresse pour le storeId: " + event.getStoreId());
        }


        // 2. Préparer l'adresse de Pickup
        Address pickupAddress = Address.builder()
                .city(store.getAddress().getCity())
                .street(store.getAddress().getStreet())
                .buildingNumber(store.getAddress().getBuildingNumber())
                .apartment(store.getAddress().getApartment())
                .latitude(store.getAddress().getLatitude())
                .longitude(store.getAddress().getLongitude())
                .build();

        // 3. Préparer l'adresse de Dropoff
        Address dropoffAddress = event.getDeliveryAddress();

        // 4. Calculs de la distance
        Double distanceKm = DistanceCalculator.calculateDistance(
                pickupAddress.getLatitude(), pickupAddress.getLongitude(),
                dropoffAddress.getLatitude(), dropoffAddress.getLongitude()
        );

        if (distanceKm == 0.0) {
            distanceKm = 1.0;
        }

        // 5. Calculate delivery cost with ML and get percentage
        BigDecimal deliveryCost;
        Double pricePercentage = null;
        if (event.getDeliveryCost() != null && event.getDeliveryCost().compareTo(BigDecimal.ZERO) > 0) {
            // ✅ Prix déjà calculé par Order_Service, on le réutilise
            deliveryCost = event.getDeliveryCost();
            log.info("💰 Using delivery cost from Order_Service: {} DH", deliveryCost);
        } else {
            // ⚠️ Fallback uniquement si l'event n'a pas le prix (legacy/compatibilité)
            deliveryCost = new BigDecimal("10.00")
                    .add(new BigDecimal(distanceKm).multiply(new BigDecimal("2.00")));
            log.warn("⚠️ No deliveryCost in event — fallback: {} DH", deliveryCost);
        }

        // 6. Calculate ETA with ML and get percentage
        Integer etaMinutes;
        Double etaPercentage = null;
        try {
            ETARequest etaRequest = ETARequest.builder()
                    .distanceKm(distanceKm)
                    .vehicleType("MOTORCYCLE")
                    .pickupLatitude(pickupAddress.getLatitude())
                    .pickupLongitude(pickupAddress.getLongitude())
                    .build();

            ETAResponse etaResponse = etaFeignClient.calculateETA(etaRequest);
            etaMinutes = etaResponse.getEstimatedMinutes();
            etaPercentage = etaResponse.getEtaPercentage();  // Get percentage from service

            // Calculate fallback for logging only
            Integer fallbackEta = 10 + (int) Math.round(distanceKm * 3);

            log.info("✅ ETA ML: {} min | change: {}% (fallback: {} min)",
                    etaMinutes,
                    etaPercentage != null ? etaPercentage : 0.0,
                    fallbackEta);

        } catch (Exception e) {
            log.warn("⚠️ ETA Service unavailable — using fallback calculation: {}", e.getMessage());
            etaMinutes = 10 + (int) Math.round(distanceKm * 3);
            etaPercentage = 0.0;
            log.info("⏱️ Using fallback ETA: {} min (0% change)", etaMinutes);
        }

        // 7. Calcul de l'argent à collecter
        BigDecimal amountToCollect = BigDecimal.ZERO;
        if (event.isCashOnDelivery()) {
            amountToCollect = event.getTotalAmount().add(deliveryCost);
        }

        // 8. Création de l'entité
        Delivery delivery = Delivery.builder()
                .orderRef(event.getOrderRef())
                .storeId(event.getStoreId())
                .customerEmail(event.getCustomerEmail())
                .pickupAddress(pickupAddress)
                .dropoffAddress(dropoffAddress)
                .cashOnDelivery(event.isCashOnDelivery())
                .amountToCollect(amountToCollect)
                .deliveryCost(deliveryCost)
                .distanceInKm(distanceKm)
                .estimatedTimeInMinutes(etaMinutes)
                .status(DeliveryStatus.PENDING)
                .build();

        deliveryRepository.save(delivery);

        // Log final summary
        log.info("📊 Delivery created - Order: {} | ETA: {} min ({}% change) | Cost: {} DH ({}% change) | Distance: {} km",
                event.getOrderRef(),
                etaMinutes,
                etaPercentage != null ? etaPercentage : 0.0,
                deliveryCost,
                pricePercentage != null ? pricePercentage : 0.0,
                distanceKm);
    }

    // ✅ acceptDelivery — customerEmail vient de la DB, courierName du JWT
    @Override
    @Transactional
    public DeliveryResponseDto acceptDelivery(Long deliveryId, String courierId, String courierName, VehicleType vehicleType, CourierLocationRequest  locationRequest) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID : " + deliveryId));
        log.info("📦 Livraison {} — statut actuel : {}", deliveryId, delivery.getStatus());

        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new RuntimeException("Cette commande n'est plus disponible !");
        }
        //calcule distance from courrier to pickUp
        Double distanceCourierToPickup = DistanceCalculator.calculateDistance(
                locationRequest.getLatitude(),
                locationRequest.getLongitude(),
                delivery.getPickupAddress().getLatitude(),
                delivery.getPickupAddress().getLongitude()
        );
        //calcule distance totale
        Double totalDistance = distanceCourierToPickup + delivery.getDistanceInKm();

        log.info("📍 Distance courrier→pickUp: {}km | pickUp→dropOff: {}km | Total: {}km",
                String.format("%.2f", distanceCourierToPickup),
                String.format("%.2f", delivery.getDistanceInKm()),
                String.format("%.2f", totalDistance));
        delivery.setDistanceInKm(totalDistance);
        delivery.setCourierId(courierId);
        delivery.setCourierName(courierName);  // ✅ stocker le nom dans l'entité
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        delivery.setVehicleType(vehicleType);

        log.info("🚀 Appel ETA_Service — distance: {}km, véhicule: {}, lat: {}, lng: {}",
                totalDistance,
                vehicleType.name(),
                delivery.getPickupAddress().getLatitude(),
                delivery.getPickupAddress().getLongitude());
        try {
            ETARequest etaRequest = ETARequest.builder()
                    .distanceKm(totalDistance)
                    .vehicleType(vehicleType.name())
                    .pickupLatitude(delivery.getPickupAddress().getLatitude())
                    .pickupLongitude(delivery.getPickupAddress().getLongitude())
                    .build();
            ETAResponse etaResponse = etaFeignClient.calculateETA(etaRequest);

            log.info("✅ ETA reçu depuis ETA_Service : {} min | météo: {} | rush: {} | via {}",
                    etaResponse.getEstimatedMinutes(),
                    etaResponse.getWeatherCondition(),
                    etaResponse.getRushHourFactor(),
                    vehicleType);

            delivery.setEstimatedTimeInMinutes(etaResponse.getEstimatedMinutes());
        } catch (Exception e) {
            // ✅ FIX: Calculate ETA based on total distance when service is unavailable
            // Assuming average speed: 30 km/h for motorcycle = 2 minutes per km
            Integer calculatedETA = (int) Math.round(totalDistance * 2);

            log.warn("⚠️ ETA Service indisponible — calcul local basé sur distance totale: {}km → {} min",
                    String.format("%.2f", totalDistance), calculatedETA);

            delivery.setEstimatedTimeInMinutes(calculatedETA);
        }
        delivery.setAcceptedAt(LocalDateTime.now());

        Delivery savedDelivery = deliveryRepository.save(delivery);
        log.info("💾 ETA final sauvegardé en DB : {} min", savedDelivery.getEstimatedTimeInMinutes());

        orderClient.updateOrderStatus(savedDelivery.getOrderRef(), ACCEPTED);


        DeliveryNotificationEvent event = DeliveryNotificationEvent.builder()
                .eventType("COURIER_ASSIGNED")
                .orderRef(savedDelivery.getOrderRef())
                .courierId(courierId)
                .courierName(courierName)           // ✅ nom lisible dans l'email
                .customerEmail(savedDelivery.getCustomerEmail()) // ✅ depuis la DB
                .message("Votre livreur est en route vers le point de retrait !")
                .estimatedTimeInMinutes(savedDelivery.getEstimatedTimeInMinutes())
                .dropoffCity(savedDelivery.getDropoffAddress().getCity())
                .dropoffStreet(savedDelivery.getDropoffAddress().getStreet())
                .dropoffBuildingNumber(savedDelivery.getDropoffAddress().getBuildingNumber())
                .dropoffApartment(savedDelivery.getDropoffAddress().getApartment())
                .dropoffLatitude(savedDelivery.getDropoffAddress().getLatitude())
                .dropoffLongitude(savedDelivery.getDropoffAddress().getLongitude())
                .build();

        kafkaProducerService.sendDeliveryEvent(event);
        return deliveryMapper.toDto(savedDelivery);
    }

    // ✅ completeDelivery — tout vient de la DB
    @Override
    @Transactional
    public DeliveryResponseDto completeDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID : " + deliveryId));

        if (delivery.getStatus() == DeliveryStatus.DELIVERED) {
            throw new RuntimeException("Cette commande est déjà clôturée !");
        }

        delivery.setStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(LocalDateTime.now());
        if (delivery.getAcceptedAt() != null) {
            long actualMinutes = java.time.temporal.ChronoUnit.MINUTES.between(
                    delivery.getAcceptedAt(),
                    delivery.getDeliveredAt()
            );
            delivery.setActualDeliveryTimeInMinutes(actualMinutes);
        }
        Delivery savedDelivery = deliveryRepository.save(delivery);

        orderClient.updateOrderStatus(savedDelivery.getOrderRef(), COMPLETED);

        DeliveryNotificationEvent event = DeliveryNotificationEvent.builder()
                .eventType("DELIVERY_COMPLETED")
                .orderRef(savedDelivery.getOrderRef())
                .courierId(savedDelivery.getCourierId())
                .courierName(savedDelivery.getCourierName())      // ✅ depuis la DB
                .customerEmail(savedDelivery.getCustomerEmail())  // ✅ depuis la DB
                .message("Votre commande a été livrée avec succès. Bon appétit ! 🎉")
                .estimatedTimeInMinutes(savedDelivery.getEstimatedTimeInMinutes())
                .dropoffCity(savedDelivery.getDropoffAddress().getCity())
                .dropoffStreet(savedDelivery.getDropoffAddress().getStreet())
                .dropoffBuildingNumber(savedDelivery.getDropoffAddress().getBuildingNumber())
                .dropoffApartment(savedDelivery.getDropoffAddress().getApartment())
                .dropoffLatitude(savedDelivery.getDropoffAddress().getLatitude())
                .dropoffLongitude(savedDelivery.getDropoffAddress().getLongitude())
                .build();

        kafkaProducerService.sendDeliveryEvent(event);
        return deliveryMapper.toDto(savedDelivery);
    }

    // ✅ getMyDeliveries — courierId vient du JWT maintenant
    @Override
    public List<DeliveryResponseDto> getMyDeliveries(String courierId) {
        return deliveryRepository.findByCourierId(courierId).stream()
                .map(deliveryMapper::toDto)
                .collect(Collectors.toList());
    }

    // ✅ Nouveau : updateCourierLocation
    @Override
    public void updateCourierLocation(String courierId, CourierLocationRequest req) {
        CourierLocation location = CourierLocation.builder()
                .courierId(courierId)
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .updatedAt(LocalDateTime.now().toString())
                .build();
        courierLocationRepository.save(location);
    }

    @Override
    public void deleteDelivery(Long deliveryId) {
        deliveryRepository.deleteById(deliveryId);
    }

    @Override
    public List<DeliveryResponseDto> getAllDeliveries() {
        log.info("Récupération de toutes les livraisons pour le Dashboard Admin");
        // On pourrait ajouter une pagination ici plus tard (Pageable)
        return deliveryRepository.findAll().stream()
                .map(deliveryMapper::toDto)
                .collect(Collectors.toList());
    }

    // DeliveryServiceImpl.java - Implémentation
    @Override
    public DistancePreviewDto previewDeliveryDistance(Long deliveryId, CourierLocationRequest courierLocationRequest, VehicleType vehicleType) {
        log.info("📏 Preview distance for delivery {} from courier position ({}, {}) with vehicle {}",
                deliveryId,
                courierLocationRequest.getLatitude(),
                courierLocationRequest.getLongitude(),
                vehicleType);

        // 1. Récupérer la livraison
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Livraison non trouvée avec l'ID: " + deliveryId));

        // 2. Vérifier que la livraison est encore disponible
        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new RuntimeException("Cette livraison n'est plus disponible (statut: " + delivery.getStatus() + ")");
        }

        // 3. Calculer la distance du livreur au point de retrait
        Double distanceToPickup = DistanceCalculator.calculateDistance(
                courierLocationRequest.getLatitude(),
                courierLocationRequest.getLongitude(),
                delivery.getPickupAddress().getLatitude(),
                delivery.getPickupAddress().getLongitude()
        );

        // 4. Distance totale (livreur → pickUp + pickUp → dropOff)
        Double totalDistance = distanceToPickup + delivery.getDistanceInKm();

        // 5. Calculer le fallback ETA selon le véhicule
        Integer fallbackEta = calculateFallbackEta(totalDistance, vehicleType);

        // 6. Appeler le vrai service ETA avec le véhicule du livreur
        Integer etaWithML = null;
        Double etaPercentage = null;

        try {
            ETARequest etaRequest = ETARequest.builder()
                    .distanceKm(totalDistance)
                    .vehicleType(vehicleType.name())
                    .pickupLatitude(delivery.getPickupAddress().getLatitude())
                    .pickupLongitude(delivery.getPickupAddress().getLongitude())
                    .build();

            ETAResponse etaResponse = etaFeignClient.calculateETA(etaRequest);
            etaWithML = etaResponse.getEstimatedMinutes();
            etaPercentage = etaResponse.getEtaPercentage();

            log.info("✅ ETA ML ({}) pour {}: {} min (change: {}%)",
                    vehicleType, delivery.getOrderRef(), etaWithML, etaPercentage);

        } catch (Exception e) {
            log.warn("⚠️ ETA Service unavailable for {}, using fallback: {} min", vehicleType, fallbackEta);
            etaWithML = fallbackEta;
            etaPercentage = 0.0;
        }

        // 7. Construire la réponse
        return DistancePreviewDto.builder()
                .deliveryId(delivery.getId())
                .orderRef(delivery.getOrderRef())
                .pickupAddress(delivery.getPickupAddress())
                .dropoffAddress(delivery.getDropoffAddress())
                .distanceToPickupKm(Math.round(distanceToPickup * 100.0) / 100.0)
                .distancePickupToDropoffKm(delivery.getDistanceInKm())
                .totalDistanceKm(Math.round(totalDistance * 100.0) / 100.0)
                .deliveryCost(delivery.getDeliveryCost())
                .estimatedEtaMinutes(etaWithML)
                .etaPercentage(etaPercentage)
                .vehicleType(vehicleType)
                .cashOnDelivery(delivery.isCashOnDelivery())
                .amountToCollect(delivery.getAmountToCollect())
                .status(delivery.getStatus())
                .build();
    }

    // Méthode utilitaire pour calculer le fallback selon le véhicule
    private Integer calculateFallbackEta(Double distanceKm, VehicleType vehicleType) {
        switch (vehicleType) {
            case BICYCLE:
                return (int) Math.round(distanceKm * 5);  // 5 min/km (12 km/h)
            case MOTORCYCLE:
                return (int) Math.round(distanceKm * 2);  // 2 min/km (30 km/h)
            case CAR:
                return (int) Math.round(distanceKm * 3);  // 3 min/km (20 km/h en ville)
            case TRUCK:
                return (int) Math.round(distanceKm * 4);  // 4 min/km (15 km/h)
            default:
                return (int) Math.round(distanceKm * 2);
        }
    }
    // Pour la route Frontend : getById(id)
    @Override
    public DeliveryResponseDto getDeliveryById(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID : " + deliveryId));
        return deliveryMapper.toDto(delivery);
    }

    // Pour les routes Frontend : getByOrderRef(ref) et trackByOrderRef(ref)
    @Override
    public DeliveryResponseDto getDeliveryByOrderRef(String orderRef) {
        Delivery delivery = deliveryRepository.findByOrderRef(orderRef)
                .orElseThrow(() -> new RuntimeException("Livraison introuvable pour la commande : " + orderRef));
        return deliveryMapper.toDto(delivery);
    }

    // Pour la route Frontend : updateStatus(id, status)
    @Override
    @Transactional
    public DeliveryResponseDto updateDeliveryStatus(Long deliveryId, DeliveryStatus newStatus) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID : " + deliveryId));

        delivery.setStatus(newStatus);
        Delivery savedDelivery = deliveryRepository.save(delivery);

        // Optionnel : Mettre à jour Order_Service si besoin selon le statut

        return deliveryMapper.toDto(savedDelivery);
    }

    @Override
    public List<DeliveryResponseDto> getDeliveriesByStoreId(String storeId) {
        log.info("🏪 Récupération des livraisons pour le store {}", storeId);
        return deliveryRepository.findByStoreId(storeId).stream()
                .map(deliveryMapper::toDto)
                .collect(Collectors.toList());
    }


}
