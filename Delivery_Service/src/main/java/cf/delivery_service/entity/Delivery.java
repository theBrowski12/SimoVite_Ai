package cf.delivery_service.entity;

import cf.delivery_service.enums.DeliveryStatus;
import cf.delivery_service.enums.VehicleType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderRef; // Référence de la commande
    private String courierId; // ID du livreur (null au début)
// Dans ton entité Delivery.java, ajoute :
    private String courierName;      // ✅ nom du coursier stocké à l'acceptation
    private String customerEmail;    // ✅ email du client stocké à la création
    // 📍 1ère Adresse : Point de retrait (Restaurant/Pharmacie)
    // 📍 1ère Adresse : Point de retrait (Restaurant/Pharmacie)
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "city", column = @Column(name = "pickup_city")),
            @AttributeOverride(name = "street", column = @Column(name = "pickup_street")),
            @AttributeOverride(name = "buildingNumber", column = @Column(name = "pickup_building_number")),
            @AttributeOverride(name = "apartment", column = @Column(name = "pickup_apartment")),
            // 🟢 AJOUT DES COORDONNÉES PICKUP :
            @AttributeOverride(name = "latitude", column = @Column(name = "pickup_latitude")),
            @AttributeOverride(name = "longitude", column = @Column(name = "pickup_longitude"))
    })
    private Address pickupAddress;

    // 📍 2ème Adresse : Point de livraison (Client)
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "city", column = @Column(name = "dropoff_city")),
            @AttributeOverride(name = "street", column = @Column(name = "dropoff_street")),
            @AttributeOverride(name = "buildingNumber", column = @Column(name = "dropoff_building_number")),
            @AttributeOverride(name = "apartment", column = @Column(name = "dropoff_apartment")),
            // 🟢 AJOUT DES COORDONNÉES DROPOFF :
            @AttributeOverride(name = "latitude", column = @Column(name = "dropoff_latitude")),
            @AttributeOverride(name = "longitude", column = @Column(name = "dropoff_longitude"))
    })
    private Address dropoffAddress;

    // 🧠 Champs calculés (Bientôt par Machine Learning)
    private Double distanceInKm;
    private BigDecimal deliveryCost; // Coût de livraison (camelCase)

    private BigDecimal amountToCollect;

    private Integer estimatedTimeInMinutes; // ETA

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status; // PENDING, ASSIGNED, PICKED_UP, DELIVERED

    @Column(nullable = false)
    private boolean cashOnDelivery;    // Si isCashOnDelivery est TRUE, c'est l'argent que le livreur doit récupérer (Prix du panier + Frais de livraison)

    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deliveredAt;
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = DeliveryStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
