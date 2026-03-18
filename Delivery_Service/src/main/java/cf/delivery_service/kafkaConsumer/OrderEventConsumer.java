package cf.delivery_service.kafkaConsumer;

import cf.delivery_service.dto.AddressDto;
import cf.delivery_service.entity.Address;
import cf.delivery_service.kafkaEvents.OrderPaidEvent;
import cf.delivery_service.service.DeliveryServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final DeliveryServiceImpl deliveryService;

    @KafkaListener(topics = "order-topics", groupId = "delivery-service-group")
    public void handleOrderEvent(OrderPaidEvent event) {
        log.info("📥 Événement Kafka reçu : {} pour la commande {}", event.getEventType(), event.getOrderRef());

        if ("ORDER_CONFIRMED".equals(event.getEventType())) {
            try {
                deliveryService.createDeliveryFromOrder(event);
                log.info("✅ Livraison créée avec succès pour la commande {}", event.getOrderRef());
            } catch (Exception e) {
                log.error("❌ Erreur lors de la création de la livraison pour la commande {} : {}", event.getOrderRef(), e.getMessage());
                // Ici tu pourrais gérer une Dead Letter Queue (DLQ) ou des retries
            }
        } else {
            log.info("⏩ Événement ignoré par le service de livraison (type non pertinent).");
        }
    }

    // Petite méthode utilitaire pour convertir le DTO en Entité
    private Address mapToAddressEntity(AddressDto dto) {
        if (dto == null) return null;
        return Address.builder()
                .city(dto.getCity())
                .street(dto.getStreet())
                .buildingNumber(dto.getBuildingNumber())
                .apartment(dto.getApartment())
                .build();
    }
}
