package cf.delivery_service.dto;

import cf.delivery_service.enums.DeliveryStatus;
import cf.delivery_service.enums.VehicleType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
    private String courierName;
    private String customerEmail;
    // DeliveryResponseDto.java
    private String storeId;

    // Adresses
    private AddressDto pickupAddress;
    private AddressDto dropoffAddress;

    // ML / ETA
    private Double distanceInKm;
    private BigDecimal deliveryCost;
    private Integer estimatedTimeInMinutes;

    // Véhicule
    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    // Paiement
    private boolean cashOnDelivery;
    private BigDecimal amountToCollect;
    // Temps réel calculé à la fin de la course
    private Long actualDeliveryTimeInMinutes;
    // Status & dates
    private DeliveryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;

    private LocalDateTime updatedAt;
    private LocalDateTime deliveredAt;
}
