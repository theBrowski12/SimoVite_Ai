package cf.order_service.service;

import cf.order_service.dto.OrderRequestDto;
import cf.order_service.dto.OrderResponseDto;
import cf.order_service.dto.catalogDto.CatalogResponseDto;
import cf.order_service.dto.priceDto.PriceRequestDto;
import cf.order_service.dto.priceDto.PriceResponseDto;
import cf.order_service.dto.specialDelivery.SpecialDeliveryRequestDto;
import cf.order_service.dto.specialDelivery.SpecialDeliveryResponseDto;
import cf.order_service.dto.storeDto.StoreResponseDto;
import cf.order_service.entity.Address;
import cf.order_service.entity.Order;
import cf.order_service.entity.OrderItem;
import cf.order_service.enums.OrderStatus;
import cf.order_service.enums.PaymentMethod;
import cf.order_service.feignClient.CatalogClient;
import cf.order_service.feignClient.PriceFeignClient;
import cf.order_service.feignClient.StoreClient;
import cf.order_service.kafkaEvents.OrderEvent;
import cf.order_service.mapper.OrderItemMapper;
import cf.order_service.mapper.OrderMapper;
import cf.order_service.repository.OrderRepository;
import cf.order_service.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static cf.order_service.enums.PaymentMethod.CASH_ON_DELIVERY;
import static cf.order_service.enums.PaymentMethod.ONLINE_PAYMENT;
import static cf.order_service.utils.DistanceCalculator.calculateDistance;

@Service
@RequiredArgsConstructor
@Transactional // Garantit que si une erreur survient, rien n'est enregistré en base
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final KafkaProducerService kafkaProducerService ;
    private final CatalogClient catalogRestClient;
    private final StoreClient storeClient;
    private final PriceFeignClient priceClient;

    @Override
    public OrderResponseDto createOrder(OrderRequestDto dto) {
        Order order = orderMapper.toEntity(dto);

        String nameFromJwt  = JwtUtils.getFullName();
        String emailFromJwt = JwtUtils.getEmail();
        String userIdFromJwt = JwtUtils.getUserId();
        //String phone= JwtUtils.getPhone();
        order.setUserId(userIdFromJwt);      // ✅ depuis JWT, pas depuis dto
        order.setFullName(nameFromJwt);      // ✅ depuis JWT, pas depuis dto
        order.setEmail(emailFromJwt);
        //order.setPhone(phone);
        order.setPaymentMethod(dto.getPaymentMethod());
        if (dto.getDeliveryAddress() != null) {
            Address address = Address.builder()
                    .city(dto.getDeliveryAddress().getCity())
                    .street(dto.getDeliveryAddress().getStreet())
                    .buildingNumber(dto.getDeliveryAddress().getBuildingNumber())
                    .apartment(dto.getDeliveryAddress().getApartment())
                    .latitude(dto.getDeliveryAddress().getLatitude())
                    .longitude(dto.getDeliveryAddress().getLongitude())
                    .build();

            order.setDeliveryAddress(address);
        }
        // Initialisation du statut de paiement
        order.setPaid(false); // Par défaut, non payé
        StoreResponseDto storeInfo = storeClient.getStoreById(dto.getStoreId());
        order.setStoreName(storeInfo.getName());
        order.setStoreCategory(storeInfo.getCategory());
        order.setItems(new ArrayList<>());

        BigDecimal totalOrderPrice = BigDecimal.ZERO;

        for (var itemDto : dto.getItems()) {
            CatalogResponseDto productInfo = catalogRestClient.getProductById(itemDto.getProductId());
            if (productInfo == null) {
                throw new RuntimeException("Produit introuvable dans le catalogue : " + itemDto.getProductId());
            }

            OrderItem item = orderItemMapper.toEntity(itemDto);
            item.setUnitPrice(productInfo.getBasePrice());
            item.setProductName(productInfo.getName());
            item.setQuantity(itemDto.getQuantity());

            BigDecimal subTotal = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
            totalOrderPrice = totalOrderPrice.add(subTotal);

            item.setOrder(order);
            item.setSubTotal(subTotal);
            order.addItem(item);
        }
        order.setPrice(totalOrderPrice);
        order.setStoreId(dto.getStoreId());
        if (order.getPaymentMethod() == null) {
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY); // ou ONLINE_PAYMENT selon ton choix
        }
        double distanceKm = calculateDistance(
                storeInfo.getAddress().getLatitude(), storeInfo.getAddress().getLongitude(),
                dto.getDeliveryAddress().getLatitude(), dto.getDeliveryAddress().getLongitude()
        );
        PriceRequestDto priceReq = PriceRequestDto.builder()
                .distance_km(distanceKm)
                .vehicle_type("MOTORCYCLE") // 👈 Ton bypass est ici !
                .category(storeInfo.getCategory())
                .pickup_latitude(storeInfo.getAddress().getLatitude())
                .pickup_longitude(storeInfo.getAddress().getLongitude())
                .order_total(order.getPrice().doubleValue())
                .build();
        PriceResponseDto priceResp  = priceClient.calculatePrice(priceReq) ;
        order.setPercentage(priceResp.getPrice_percentage());
        if (priceResp != null) {
            BigDecimal deliveryCost = BigDecimal.valueOf(priceResp.getDelivery_cost());
            order.setDeliveryCost(deliveryCost);
            // On ajoute la livraison au total de la commande !
            order.setPrice(order.getPrice().add(deliveryCost));
        } else {
            order.setDeliveryCost(BigDecimal.ZERO);
            // Le prix reste le même car la livraison est à 0
        }
        Order savedOrder = orderRepository.save(order);

        // 🔀 LA BIFURCATION EST ICI
        if (savedOrder.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            log.info("💵 Paiement en espèce sélectionné. Confirmation immédiate de la commande.");
            sendOrderConfirmedEvent(savedOrder, emailFromJwt);
        } else {
            log.info("💳 Paiement en ligne sélectionné. En attente de la validation du paiement pour la commande {}.", savedOrder.getOrderRef());
            // Note : Tu pourrais envoyer un événement Kafka "ORDER_PENDING_PAYMENT" ici juste pour que
            // le Notification_Service envoie un mail "Merci de finaliser votre paiement".
        }

        return orderMapper.toResponseDto(savedOrder);
    }

    @Override
    @Transactional
    public SpecialDeliveryResponseDto createSpecialDeliveryOrder(SpecialDeliveryRequestDto dto) {
        // 1. Map the DTO to the Entity using your shiny new mapper method
        Order order = orderMapper.specialDeliveryToEntity(dto);

        // 2. Inject Context (Security JWT)
        String nameFromJwt = JwtUtils.getFullName();
        String emailFromJwt = JwtUtils.getEmail();
        String userIdFromJwt = JwtUtils.getUserId();

        order.setUserId(userIdFromJwt);
        order.setFullName(nameFromJwt);
        order.setEmail(emailFromJwt);
        order.setPaid(false);

        if (order.getPaymentMethod() == null) {
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        }

        // 3. Fetch the Base Service Price from the Catalog
        CatalogResponseDto serviceInfo = catalogRestClient.getProductById(dto.getCatalogSpecialDeliveryId());
        if (serviceInfo == null) {
            throw new RuntimeException("Service de livraison spécial introuvable : " + dto.getCatalogSpecialDeliveryId());
        }

        // ✅ FIX: No more OrderItems! The base price from the catalog is our starting total.
        BigDecimal basePrice = serviceInfo.getBasePrice();
        BigDecimal totalOrderPrice = basePrice;

        // 4. Calculate Distance dynamically (Security: Don't trust the frontend's distance)
        double distanceKm = 0.0;
        if (dto.getPickupAddress() != null && dto.getDropoffAddress() != null) {
            distanceKm = calculateDistance(
                    dto.getPickupAddress().getLatitude(), dto.getPickupAddress().getLongitude(),
                    dto.getDropoffAddress().getLatitude(), dto.getDropoffAddress().getLongitude()
            );
        }

        // Ensure category is set for the ML Pricing engine
        String categoryForPricing = order.getStoreCategory() != null ? order.getStoreCategory() : "SPECIAL_DELIVERY";
        order.setStoreCategory(categoryForPricing);

        // 5. Calculate Logistics Pricing via ML
        PriceRequestDto priceReq = PriceRequestDto.builder()
                .distance_km(distanceKm)
                .vehicle_type("MOTORCYCLE") // Or fetch from catalog serviceInfo if available
                .category(categoryForPricing)
                .pickup_latitude(dto.getPickupAddress().getLatitude())
                .pickup_longitude(dto.getPickupAddress().getLongitude())
                .order_total(basePrice.doubleValue())
                .build();

        PriceResponseDto priceResp = priceClient.calculatePrice(priceReq);

        if (priceResp != null) {
            order.setPercentage(priceResp.getPrice_percentage());
            BigDecimal deliveryCost = BigDecimal.valueOf(priceResp.getDelivery_cost());

            // 💡 Weight Surcharge (Example)
            if (order.getTotalWeightKg() != null && order.getTotalWeightKg() > 5.0) {
                deliveryCost = deliveryCost.add(new BigDecimal("10.00")); // +10 MAD for heavy packages
            }

            order.setDeliveryCost(deliveryCost);
            totalOrderPrice = totalOrderPrice.add(deliveryCost);
        } else {
            order.setDeliveryCost(BigDecimal.ZERO);
        }

        // ✅ Set the final calculated price directly on the order
        order.setPrice(totalOrderPrice);

        // 6. Save to Database
        Order savedOrder = orderRepository.save(order);

        // 7. Fire Events
        if (savedOrder.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            log.info("📦 Paiement en espèce sélectionné pour Colis ({}). Confirmation immédiate.", savedOrder.getOrderRef());
            sendOrderConfirmedEvent(savedOrder, emailFromJwt);
        } else {
            log.info("💳 Paiement en ligne sélectionné pour Colis ({}). En attente de paiement.", savedOrder.getOrderRef());
        }

        // 8. Map to Response DTO
        SpecialDeliveryResponseDto responseDto = orderMapper.toSpecialDeliveryResponseDto(savedOrder);

        // ✅ Add the dynamically calculated distance to the response so the frontend can display it
        responseDto.setCalculatedDistanceKm(distanceKm);

        return responseDto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getOrdersByStoreId(String storeId) {
        return orderRepository.findByStoreId(storeId).stream()
                .map(orderMapper::toResponseDto)
                .collect(Collectors.toList());
    }
    // ⭐ NOUVELLE MÉTHODE : À appeler depuis le contrôleur quand le mock de paiement Front est OK
    @Override
    public OrderResponseDto confirmOnlinePayment(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + id));

        if (order.getPaymentMethod() == CASH_ON_DELIVERY) {
            throw new RuntimeException("Cette commande est configurée pour un paiement en espèce.");
        }

        if (order.isPaid()) {
            throw new RuntimeException("Cette commande a déjà été payée.");
        }

        order.setPaid(true);
        Order savedOrder = orderRepository.save(order);

        log.info("✅ Paiement en ligne validé pour la commande {}.", savedOrder.getOrderRef());

        // Maintenant on peut prévenir le livreur !
        String emailFromJwt = JwtUtils.getEmail();
        sendOrderConfirmedEvent(savedOrder, emailFromJwt);

        return orderMapper.toResponseDto(savedOrder);
    }

    // 🛠️ MÉTHODE UTILITAIRE : Centralise l'envoi Kafka
    private void sendOrderConfirmedEvent(Order order, String email) {
        try {
            OrderEvent event = new OrderEvent();
            event.setEventType("ORDER_CONFIRMED");
            event.setOrderRef(order.getOrderRef());

            // 1. Identify the type of order for the Delivery Service
            event.setOrderType(order.getOrderType() != null ? order.getOrderType().name() : "REGULAR");

            event.setUserName(order.getFullName());
            event.setEmail(email != null ? email : "no-email@example.com");
            event.setCreatedAt(LocalDateTime.now().toString());
            event.setTotalAmount(order.getPrice());

            // 2. Map Addresses (Both Drop-off AND Pick-up)
            event.setDeliveryAddress(order.getDeliveryAddress());
            event.setPickUpAddress(order.getPickUpAddress()); // Crucial for Special Deliveries

            event.setStoreId(order.getStoreId());
            event.setDeliveryCost(order.getDeliveryCost());
            event.setCashOnDelivery(order.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY);

            // 3. Smart Category Fetching (Avoids unnecessary API calls!)
            String storeCategory = order.getStoreCategory();
            if (storeCategory == null && order.getStoreId() != null) {
                try {
                    StoreResponseDto store = storeClient.getStoreById(order.getStoreId());
                    storeCategory = store.getCategory();
                    log.info("✅ Store info retrieved: {} - Category: {}", store.getName(), storeCategory);
                } catch (Exception e) {
                    log.error("⚠️ Could not fetch store info for ID {}: {}", order.getStoreId(), e.getMessage());
                    storeCategory = "UNKNOWN"; // Fallback value
                }
            }
            event.setStoreCategory(storeCategory);

            // 4. Map the new Special Delivery fields
            event.setProductName(order.getProductName());
            event.setTotalWeightKg(order.getTotalWeightKg());
            event.setInstructions(order.getInstructions());
            event.setSenderName(order.getSenderName());
            event.setSenderPhone(order.getSenderPhone());
            event.setReceiverName(order.getReceiverName());
            event.setReceiverPhone(order.getReceiverPhone());

            // 5. Safely map items ONLY if they exist (Fixes the NullPointerException!)
            if (order.getItems() != null && !order.getItems().isEmpty()) {
                List<OrderEvent.OrderItemEvent> itemEvents = order.getItems().stream()
                        .map(item -> new OrderEvent.OrderItemEvent(
                                item.getProductName(),
                                item.getQuantity(),
                                item.getUnitPrice()
                        ))
                        .toList();
                event.setItems(itemEvents);
            }

            kafkaProducerService.sendOrderEvent(event);
            log.info("📨 Événement de confirmation envoyé pour créer la livraison. Ref: {}, Type: {}",
                    event.getOrderRef(), event.getOrderType());

        } catch (Exception e) {
            log.error("⚠️ Erreur Kafka : {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + id));
        return orderMapper.toResponseDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponseDto getOrderByRef(String ref) {
        Order order = orderRepository.findByOrderRef(ref)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec la référence: " + ref));
        return orderMapper.toResponseDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponseDto> getOrdersByUserId(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(orderMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponseDto updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));
        order.setStatus(status);
        log.info("✅ Statut de la commande {} mis à jour avec succès !", id);
        return orderMapper.toResponseDto(orderRepository.save(order));
    }
    @Override
    @Transactional
    public OrderResponseDto updateOrderStatusByRef(String orderRef, OrderStatus status) {
        Order order = orderRepository.findByOrderRef(orderRef)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec la réf : " + orderRef));

        order.setStatus(status);
        log.info("✅ Statut de la commande {} mis à jour avec succès vers {} !", orderRef, status);

        return orderMapper.toResponseDto(orderRepository.save(order));
    }

    @Override
    public OrderResponseDto updateOrder(Long id, OrderRequestDto dto) {
        // 1. Récupérer l'existant
        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID: " + id));

        // 2. Vérifier si la commande peut encore être modifiée
        if (existingOrder.getStatus() != OrderStatus.PENDING) {
            throw new RuntimeException("Une commande ne peut être modifiée que si elle est en attente (PENDING)");
        }

        // 3. Mettre à jour les informations de base
        existingOrder.setDeliveryAddress(dto.getDeliveryAddress());

        // 4. Mettre à jour les articles (Vider et Reconstruire)
        // Grâce à orphanRemoval = true, les anciens items seront supprimés de la DB
        existingOrder.getItems().clear();

        BigDecimal newTotalPrice = BigDecimal.ZERO;
        for (var itemDto : dto.getItems()) {
            CatalogResponseDto productInfo = catalogRestClient.getProductById(itemDto.getProductId());
            if (productInfo == null) {
                throw new RuntimeException("Produit introuvable : " + itemDto.getProductId());
            }
            OrderItem newItem = orderItemMapper.toEntity(itemDto);
            newItem.setUnitPrice(productInfo.getBasePrice());
            newItem.setProductName(productInfo.getName());
            newItem.setQuantity(itemDto.getQuantity());
            BigDecimal subTotal = newItem.getUnitPrice().multiply(new BigDecimal(newItem.getQuantity()));
            newTotalPrice = newTotalPrice.add(subTotal);

            existingOrder.addItem(newItem);
        }

        existingOrder.setPrice(newTotalPrice);

        // 5. Sauvegarder les modifications
        Order updatedOrder = orderRepository.save(existingOrder);
        return orderMapper.toResponseDto(updatedOrder);
    }

    @Override
    public void deleteOrder(Long id) {
        log.info("🗑️ Tentative de suppression de la commande avec l'ID: {}", id);

        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Commande introuvable avec l'ID : " + id);
        }

        // Grâce au CascadeType.ALL dans l'entité Order,
        // les OrderItems associés seront automatiquement supprimés de la DB !
        orderRepository.deleteById(id);

        log.info("✅ Commande {} supprimée avec succès", id);
    }

    @Override
    public List<OrderResponseDto> getAllOrders() {
        log.info("📋 Récupération de toutes les commandes");
        List<Order> orders = orderRepository.findAll();

        return orders.stream()
                .map(orderMapper::toResponseDto)
                .toList(); // ou .collect(Collectors.toList()) si tu n'es pas en Java 16+
    }

    @Override
    public OrderResponseDto applyDiscount(Long id, Double percentage) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        // Validation : on ne peut pas faire une promo > 100% ou < 0%
        if (percentage < 0 || percentage > 100) {
            throw new IllegalArgumentException("Le pourcentage doit être entre 0 et 100");
        }

        // Calculer le nouveau prix
        // Formule : NouveauPrix = PrixActuel * (1 - (Pourcentage/100))
        BigDecimal factor = BigDecimal.valueOf(1 - (percentage / 100));
        BigDecimal newPrice = order.getPrice().multiply(factor);

        order.setPrice(newPrice);
        order.setDiscountPercentage(percentage); // On garde une trace !

        return orderMapper.toResponseDto(orderRepository.save(order));
    }
}
