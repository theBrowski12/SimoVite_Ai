package cf.delivery_service.dto;

import cf.delivery_service.entity.Address;
import cf.delivery_service.enums.DeliveryStatus;
import cf.delivery_service.enums.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistancePreviewDto {
    private Long deliveryId;
    private String orderRef;
    private Address pickupAddress;
    private Address dropoffAddress;

    // Distances
    private Double distanceToPickupKm;           // Livreur → Restaurant
    private Double distancePickupToDropoffKm;    // Restaurant → Client
    private Double totalDistanceKm;               // Distance totale

    // Prix
    private BigDecimal deliveryCost;              // Prix de livraison (fixe)
    private Boolean cashOnDelivery;               // Paiement à la livraison ?
    private BigDecimal amountToCollect;           // Montant à collecter

    // ETA avec le véhicule du livreur
    private Integer estimatedEtaMinutes;          // ETA calculé avec ML
    private Double etaPercentage;                 // Pourcentage de changement
    private VehicleType vehicleType;              // Véhicule utilisé

    private DeliveryStatus status;
}
