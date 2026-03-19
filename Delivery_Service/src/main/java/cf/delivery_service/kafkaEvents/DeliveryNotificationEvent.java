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
    private String courierName;
    private String customerEmail;
    private String message;
    private Integer estimatedTimeInMinutes;
    private String dropoffCity;
    private String dropoffStreet;
    private String dropoffBuildingNumber;
    private String dropoffApartment;
    private Double dropoffLatitude;
    private Double dropoffLongitude;

}
