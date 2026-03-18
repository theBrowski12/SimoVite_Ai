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
        String subject = "SimoVite - Votre livreur est en route ! 🏍️";
        StringBuilder body = new StringBuilder();
        String timeNow = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

        body.append("Bonjour,\n\n");
        body.append("Bonne nouvelle ! Votre commande ").append(event.getOrderRef()).append(" a été prise en charge.\n\n");

        body.append("📦 DÉTAILS DE LA LIVRAISON :\n");
        body.append("--------------------------------------------------\n");
        body.append("Livreur (ID)   : ").append(event.getCourierId()).append("\n");
        body.append("Heure de prise : ").append(timeNow).append("\n");

        if (event.getEstimatedTimeInMinutes() != null) {
            body.append("Temps estimé   : ~").append(event.getEstimatedTimeInMinutes()).append(" minutes\n");
        }

        // ✅ Full address block
        body.append("Adresse        : ");
        if (event.getDropoffStreet() != null)         body.append(event.getDropoffStreet());
        if (event.getDropoffBuildingNumber() != null) body.append(", Bât. ").append(event.getDropoffBuildingNumber());
        if (event.getDropoffApartment() != null)      body.append(", Appt. ").append(event.getDropoffApartment());
        if (event.getDropoffCity() != null)           body.append(", ").append(event.getDropoffCity());
        body.append("\n");

        // ✅ Google Maps link
        if (event.getDropoffLatitude() != null && event.getDropoffLongitude() != null) {
            String mapsLink = "https://www.google.com/maps?q="
                    + event.getDropoffLatitude() + "," + event.getDropoffLongitude();
            body.append("📍 Voir sur Google Maps : ").append(mapsLink).append("\n");
        }

        body.append("--------------------------------------------------\n\n");
        body.append("Message du système : ").append(event.getMessage()).append("\n\n");
        body.append("Préparez-vous à réceptionner votre commande !\n\n");
        body.append("L'équipe SimoVite 🚀");

        emailService.sendBookingEmail(event.getCustomerEmail(), subject, body.toString());
    }

    private void sendOrderFinishedEmail(DeliveryNotificationEvent event) {
        String subject = "SimoVite - Commande livrée ! ✅";
        StringBuilder body = new StringBuilder();

        body.append("Bonjour,\n\n");
        body.append("Votre commande ").append(event.getOrderRef()).append(" vient d'être livrée avec succès !\n\n");
        body.append("Nous espérons que vous êtes satisfait du service.\n");
        body.append("Bon appétit et à très vite sur SimoVite ! 🍔\n\n");
        body.append("L'équipe SimoVite 🚀");

        emailService.sendBookingEmail(event.getCustomerEmail(), subject, body.toString());
    }
}
