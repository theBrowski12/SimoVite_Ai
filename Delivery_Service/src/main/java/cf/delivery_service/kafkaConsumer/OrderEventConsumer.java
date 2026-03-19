package cf.delivery_service.kafkaConsumer;

import cf.delivery_service.dto.AddressDto;
import cf.delivery_service.entity.Address;
import cf.delivery_service.kafkaEvents.OrderPaidEvent;
import cf.delivery_service.service.DeliveryServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final DeliveryServiceImpl deliveryService;

    @KafkaListener(topics = "order-topics", groupId = "delivery-service-group")
    public void handleOrderEvent(OrderPaidEvent event) {
        log.info("📥 Événement Kafka reçu : {} pour la commande {}", event.getEventType(), event.getOrderRef());

        if ("ORDER_CONFIRMED".equals(event.getEventType())) {

            // 👇 CRÉER UN CONTEXTE DE SÉCURITÉ TEMPORAIRE POUR L'APPEL FEIGN
            try {
                // Créer une authentification système
                UsernamePasswordAuthenticationToken systemAuth =
                        new UsernamePasswordAuthenticationToken(
                                "system",
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_SYSTEM"))
                        );

                // Définir le contexte de sécurité
                SecurityContextHolder.getContext().setAuthentication(systemAuth);
                log.info("🔧 Contexte de sécurité système créé pour l'appel Feign");

                // Appel au service de livraison
                deliveryService.createDeliveryFromOrder(event);
                log.info("✅ Livraison créée avec succès pour la commande {}", event.getOrderRef());

            } catch (Exception e) {
                log.error("❌ Erreur lors de la création de la livraison pour la commande {} : {}",
                        event.getOrderRef(), e.getMessage());
                e.printStackTrace();
                // Ici tu pourrais gérer une Dead Letter Queue (DLQ) ou des retries
            } finally {
                // 👇 NETTOYER LE CONTEXTE (TRÈS IMPORTANT)
                SecurityContextHolder.clearContext();
                log.info("🧹 Contexte de sécurité nettoyé");
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
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();
    }
}
