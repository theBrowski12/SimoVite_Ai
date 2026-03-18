package cf.delivery_service.kafkaEvents;

import cf.delivery_service.dto.AddressDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryNotificationEvent {
    private String eventType; // "COURIER_ASSIGNED" ou "ORDER_FINISHED"
    private String orderRef;
    private String courierId;
    private String customerEmail; // On supposera qu'on l'a récupéré
    private String message;
    private int estimatedTimeInMinutes;
    private AddressDto dropoffAddress;
    private String dropoffCity;
    private String dropoffStreet;

}
