package cf.notification_service.consumer;

import cf.notification_service.dto.OrderEvent;
import cf.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = "order-topics",
            groupId = "notification-order-group",
            containerFactory = "orderKafkaListenerContainerFactory"
    )
    public void consumeOrderEvent(OrderEvent event) {
        log.info("📩 Message Kafka reçu pour la commande : {}, Type: {}", event.getOrderRef(), event.getOrderType());

        try {
            boolean isSpecialDelivery = "SPECIAL_DELIVERY".equals(event.getOrderType());

            // Sujet dynamique selon le type de service
            String subject = isSpecialDelivery
                    ? "📦 SimoVite - Confirmation de votre expédition (Colis) " + event.getOrderRef()
                    : "🍔 SimoVite - Confirmation de votre commande " + event.getOrderRef();

            StringBuilder body = new StringBuilder();

            body.append("Bonjour ").append(event.getUserName()).append(",\n\n");
            body.append("Merci de choisir SimoVite ! 🎉\n");
            body.append(isSpecialDelivery
                    ? "Votre demande de livraison de colis a été enregistrée avec succès.\n\n"
                    : "Votre commande a été enregistrée avec succès.\n\n");

            body.append("🧾 DÉTAILS DE LA TRANSACTION :\n");
            body.append("--------------------------------------------------\n");
            body.append("Référence : ").append(event.getOrderRef()).append("\n");
            body.append("Date      : ").append(event.getCreatedAt() != null ? event.getCreatedAt() : "N/A").append("\n");
            body.append("Paiement  : ").append(event.isCashOnDelivery() ? "Paiement à la livraison" : "Payé en ligne").append("\n");
            body.append("--------------------------------------------------\n\n");

            // 🔀 LE FAMEUX "FORK IN THE ROAD"
            if (isSpecialDelivery) {
                // Template Email pour l'envoi de colis (C2C)
                body.append("📦 DÉTAILS DU COLIS :\n");
                body.append(" Contenu      : ").append(event.getProductName() != null ? event.getProductName() : "Colis Spécial").append("\n");
                if (event.getTotalWeightKg() != null) {
                    body.append(String.format(" Poids estimé : %.2f kg\n", event.getTotalWeightKg()));
                }
                if (event.getInstructions() != null && !event.getInstructions().isEmpty()) {
                    body.append(" Instructions : ").append(event.getInstructions()).append("\n");
                }
                body.append("\n");

                body.append("📍 CONTACTS LOGISTIQUES :\n");
                body.append(" Expéditeur   : ").append(event.getSenderName()).append(" (").append(event.getSenderPhone()).append(")\n");
                body.append(" Destinataire : ").append(event.getReceiverName()).append(" (").append(event.getReceiverPhone()).append(")\n");

            } else {
                // Template Email classique pour Nourriture/Pharmacie (B2C)
                body.append("🛒 VOS ARTICLES :\n");
                if (event.getItems() != null && !event.getItems().isEmpty()) {
                    for (OrderEvent.OrderItemEvent item : event.getItems()) {
                        body.append(String.format(" 🔸 %dx %s - %.2f DH/unité\n",
                                item.getQuantity(),
                                item.getProductName(),
                                item.getUnitPrice()));
                    }
                } else {
                    body.append(" Aucun article détaillé.\n");
                }
            }

            body.append("--------------------------------------------------\n");

            // Affichage des frais de livraison si disponibles
            if (event.getDeliveryCost() != null) {
                body.append(String.format("🛵 Frais de livraison : %.2f DH\n", event.getDeliveryCost().doubleValue()));
            }

            // Affichage du prix total
            double total = event.getTotalAmount() != null ? event.getTotalAmount().doubleValue() : 0.0;
            body.append(String.format("💰 TOTAL À PAYER    : %.2f DH\n", total));
            body.append("--------------------------------------------------\n\n");

            body.append("Vous pouvez suivre l'état de votre livraison directement sur notre application.\n\n");
            body.append("À très bientôt,\n");
            body.append("L'équipe SimoVite 🚀");

            // Envoi de l'email
            emailService.sendBookingEmail(event.getEmail(), subject, body.toString());

            log.info("✅ Email de confirmation envoyé avec succès à : {}", event.getEmail());

        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement de l'email pour la référence {}: {}",
                    event.getOrderRef(), e.getMessage());
        }
    }
}
