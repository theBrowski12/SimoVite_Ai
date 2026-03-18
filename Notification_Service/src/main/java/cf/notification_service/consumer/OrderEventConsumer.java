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
            groupId = "notification-order-group",        // ✅ unique group
            containerFactory = "orderKafkaListenerContainerFactory"  // ✅

    )
    public void consumeOrderEvent(OrderEvent event) {
        log.info("📩 Message Kafka reçu pour la commande : {}", event.getOrderRef());

        try {
            String subject = "SimoVite - Confirmation de votre commande " + event.getOrderRef();

            // 1. Utilisation de StringBuilder pour construire le reçu dynamiquement
            StringBuilder body = new StringBuilder();

            body.append("Bonjour ").append(event.getUserName()).append(",\n\n");
            body.append("Merci de choisir SimoVite ! 🎉\n");
            body.append("Votre commande a été enregistrée avec succès.\n\n");

            body.append("🧾 DÉTAILS DE LA COMMANDE :\n");
            body.append("--------------------------------------------------\n");
            body.append("Référence : ").append(event.getOrderRef()).append("\n");
            body.append("Date      : ").append(event.getCreatedAt()).append("\n");
            body.append("Statut    : ").append(event.getEventType()).append("\n");
            body.append("--------------------------------------------------\n\n");

            body.append("🛒 VOS ARTICLES :\n");

            // 2. Boucle pour afficher chaque article reçu de Kafka
            if (event.getItems() != null && !event.getItems().isEmpty()) {
                for (OrderEvent.OrderItemEvent item : event.getItems()) {
                    // String.format ici permet d'aligner le texte et d'afficher les prix avec 2 décimales
                    body.append(String.format(" 🔸 %dx %s - %.2f DH/unité\n",
                            item.getQuantity(),
                            item.getProductName(),
                            item.getUnitPrice()));
                }
            } else {
                body.append(" Aucun article détaillé.\n");
            }

            body.append("--------------------------------------------------\n");

            // 3. Affichage du prix total (avec sécurité si null)
            double total = event.getTotalAmount() != null ? event.getTotalAmount().doubleValue() : 0.0;
            body.append(String.format("💰 PRIX TOTAL : %.2f DH\n", total));
            body.append("--------------------------------------------------\n\n");

            body.append("Vous pouvez suivre l'état de votre livraison directement sur notre application.\n\n");
            body.append("À très bientôt,\n");
            body.append("L'équipe SimoVite 🚀");

            // 4. Envoi de l'email
            emailService.sendBookingEmail(event.getEmail(), subject, body.toString());

            log.info("✅ Email de confirmation envoyé avec succès à : {}", event.getEmail());

        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement de l'email pour la référence {}: {}",
                    event.getOrderRef(), e.getMessage());
        }
    }
}
