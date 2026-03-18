package cf.delivery_service.dto;

import cf.delivery_service.enums.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryResponseDto {
    private Long id;
    private String orderRef;
    private String courierId;

    // Adresses structurées
    private AddressDto pickupAddress;
    private AddressDto dropoffAddress;

    // Champs ML
    private Double distanceInKm;// à calculer depuis les adresses ou bien longtitude et lattitude ?
    private BigDecimal deliveryCost; // Ajout du coût !
    private Integer estimatedTimeInMinutes;//depuis ETA_Service

    private DeliveryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;
}
