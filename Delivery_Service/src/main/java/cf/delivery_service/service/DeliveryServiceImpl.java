package cf.delivery_service.service;

import cf.delivery_service.dto.CourierLocationRequest;
import cf.delivery_service.dto.DeliveryResponseDto;
import cf.delivery_service.dto.StoreResponseDto;
import cf.delivery_service.entity.Address;
import cf.delivery_service.entity.CourierLocation;
import cf.delivery_service.entity.Delivery;
import cf.delivery_service.enums.DeliveryStatus;
import cf.delivery_service.feignClient.OrderClient;
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

        // 2. Préparer l'adresse de Pickup (Depuis le Feign Client)
        Address pickupAddress = Address.builder()
                .city(store.getAddress().getCity())
                .street(store.getAddress().getStreet())
                .latitude(store.getAddress().getLatitude()) // À ajouter plus tard
                .longitude(store.getAddress().getLongitude()) // À ajouter plus tard
                .build();

        // 3. Préparer l'adresse de Dropoff
        Address dropoffAddress = event.getDeliveryAddress();

        // 4. Calculs de la distance et des frais
        Double distanceKm = DistanceCalculator.calculateDistance(
                pickupAddress.getLatitude(), pickupAddress.getLongitude(),
                dropoffAddress.getLatitude(), dropoffAddress.getLongitude()
        );

        // Si on ne peut pas calculer la distance, on met un minimum de 1km par défaut
        if (distanceKm == 0.0) {
            distanceKm = 1.0;
        }

        // Modèle de tarification simple : 10 Dhs de base + 2 Dhs par Kilomètre
        BigDecimal deliveryCost = new BigDecimal("10.00")
                .add(new BigDecimal(distanceKm).multiply(new BigDecimal("2.00")));

        // Estimer l'ETA : environ 3 minutes par kilomètre + 10 mins au resto
        // à changer pour retriver eta depuis ETA_Service
        Integer etaMinutes = 10 + (int) Math.round(distanceKm * 3);

        // 5. Calcul de l'argent à collecter si paiement à la livraison

        BigDecimal amountToCollect = BigDecimal.ZERO;
        if (event.isCashOnDelivery()) {
            amountToCollect = event.getTotalAmount().add(deliveryCost);
        }

        // 6. Création de l'entité
        Delivery delivery = Delivery.builder()
                .orderRef(event.getOrderRef())
                .customerEmail(event.getCustomerEmail())
                .pickupAddress(pickupAddress)
                .dropoffAddress(dropoffAddress)
                .isCashOnDelivery(event.isCashOnDelivery())
                .amountToCollect(amountToCollect)
                .deliveryCost(deliveryCost)
                .distanceInKm(distanceKm)
                .estimatedTimeInMinutes(etaMinutes)
                .status(DeliveryStatus.PENDING)
                .build();

        deliveryRepository.save(delivery);
    }

    // ✅ acceptDelivery — customerEmail vient de la DB, courierName du JWT
    @Override
    @Transactional
    public DeliveryResponseDto acceptDelivery(Long deliveryId, String courierId, String courierName) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Livraison introuvable avec l'ID : " + deliveryId));

        if (delivery.getStatus() != DeliveryStatus.PENDING) {
            throw new RuntimeException("Cette commande n'est plus disponible !");
        }

        delivery.setCourierId(courierId);
        delivery.setCourierName(courierName);  // ✅ stocker le nom dans l'entité
        delivery.setStatus(DeliveryStatus.ASSIGNED);
        Delivery savedDelivery = deliveryRepository.save(delivery);

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
}
