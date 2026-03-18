package cf.notification_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeliveryNotificationEvent {
    private String eventType; // "COURIER_ASSIGNED" ou "ORDER_FINISHED"
    private String orderRef;
    private String courierId; // Ou le nom du livreur si tu l'as
    private String customerEmail;
    private String message;

    // 👇 Les nouveaux champs pour ton email détaillé !
    private Integer estimatedTimeInMinutes;
    private String dropoffCity;
    private String dropoffStreet;
}
