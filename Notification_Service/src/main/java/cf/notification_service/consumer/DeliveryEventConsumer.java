package cf.notification_service.consumer;

import cf.notification_service.dto.DeliveryNotificationEvent;
import cf.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class DeliveryEventConsumer {

    private final EmailService emailService;

    @KafkaListener(topics = "delivery-topics",
            groupId = "notification-delivery-group",        // ✅ unique
            containerFactory = "deliveryKafkaListenerContainerFactory"  // ✅
    )
    public void consumeDeliveryEvent(DeliveryNotificationEvent event) {
        log.info("🏍️ Message Kafka reçu pour la livraison : {} (Type: {})", event.getOrderRef(), event.getEventType());

        try {
            if ("COURIER_ASSIGNED".equals(event.getEventType())) {
                sendCourierAssignedEmail(event);
            } else if ("DELIVERY_COMPLETED".equals(event.getEventType())) { // 🟢 ICI : On écoute le nouveau nom
                sendOrderFinishedEmail(event);
            } else {
                log.warn("Type d'événement inconnu : {}", event.getEventType());
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email pour {} : {}", event.getOrderRef(), e.getMessage());
        }
    }

    private void sendCourierAssignedEmail(DeliveryNotificationEvent event) {
        String subject = "SimoVite — Votre commande est en cours de livraison 🚀";
        String timeNow = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        StringBuilder body = new StringBuilder();
        body.append("Bonjour,\n\n");
        body.append("Nous avons le plaisir de vous informer que votre commande a été prise en charge par l'un de nos livreurs.\n\n");

        body.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        body.append("          📦 DÉTAILS DE VOTRE LIVRAISON\n");
        body.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

        body.append("  🔖 Référence commande  : ").append(event.getOrderRef()).append("\n");
        body.append("  🏍️  Livreur assigné     : ").append(event.getCourierName() != null ? event.getCourierName() : "En cours d'assignation").append("\n");
        body.append("  🕐 Heure de prise en charge : ").append(timeNow).append("\n");

        if (event.getEstimatedTimeInMinutes() != null) {
            body.append("  ⏱️  Temps estimé        : environ ").append(event.getEstimatedTimeInMinutes()).append(" minutes\n");
        }

        body.append("\n  📍 Adresse de livraison :\n");
        body.append("     ");
        if (event.getDropoffStreet() != null)         body.append(event.getDropoffStreet());
        if (event.getDropoffBuildingNumber() != null) body.append(", Bât. ").append(event.getDropoffBuildingNumber());
        if (event.getDropoffApartment() != null)      body.append(", Appt. ").append(event.getDropoffApartment());
        if (event.getDropoffCity() != null)           body.append(", ").append(event.getDropoffCity());
        body.append("\n");

        if (event.getDropoffLatitude() != null && event.getDropoffLongitude() != null) {
            String mapsLink = "https://www.google.com/maps?q="
                    + event.getDropoffLatitude() + "," + event.getDropoffLongitude();
            body.append("     🗺️  Voir sur Google Maps : ").append(mapsLink).append("\n");
        }

        body.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        body.append("Vous pouvez suivre l'état de votre livraison en temps réel depuis l'application SimoVite.\n\n");
        body.append("Pour toute question, notre équipe reste à votre disposition.\n\n");
        body.append("Cordialement,\n");
        body.append("L'équipe SimoVite 🚀\n");
        body.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        body.append("Cet email est généré automatiquement, merci de ne pas y répondre.");

        emailService.sendBookingEmail(event.getCustomerEmail(), subject, body.toString());
    }

    private void sendOrderFinishedEmail(DeliveryNotificationEvent event) {
        String subject = "SimoVite — Votre commande a été livrée avec succès ✅";
        String timeNow = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm 'le' dd/MM/yyyy"));

        StringBuilder body = new StringBuilder();
        body.append("Bonjour,\n\n");
        body.append("Votre commande a été livrée avec succès. Nous espérons que vous êtes pleinement satisfait de notre service.\n\n");

        body.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        body.append("          ✅ CONFIRMATION DE LIVRAISON\n");
        body.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

        body.append("  🔖 Référence commande  : ").append(event.getOrderRef()).append("\n");
        body.append("  🏍️  Livrée par          : ").append(event.getCourierName() != null ? event.getCourierName() : "Livreur SimoVite").append("\n");
        body.append("  🕐 Heure de livraison  : ").append(timeNow).append("\n\n");

        body.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
        body.append("Merci de faire confiance à SimoVite pour vos livraisons. 🙏\n");
        body.append("Votre satisfaction est notre priorité.\n\n");
        body.append("N'hésitez pas à laisser un avis sur notre application — vos retours nous aident à nous améliorer !\n\n");
        body.append("Cordialement,\n");
        body.append("L'équipe SimoVite 🚀\n");
        body.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        body.append("Cet email est généré automatiquement, merci de ne pas y répondre.");

        emailService.sendBookingEmail(event.getCustomerEmail(), subject, body.toString());
    }
}
