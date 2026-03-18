package cf.order_service.entity;

import cf.order_service.enums.OrderStatus;
import cf.order_service.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders") //evite crash sql
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String orderRef;
    @Column(nullable = false)
    private String userId;
    @Column(nullable = false)
    private String fullName;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;
    @Column(nullable = false)
    private BigDecimal price;
    @Column(nullable = false)
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "city", column = @Column(name = "delivery_city")),
            @AttributeOverride(name = "street", column = @Column(name = "delivery_street")),
            @AttributeOverride(name = "buildingNumber", column = @Column(name = "delivery_building_number")),
            @AttributeOverride(name = "apartment", column = @Column(name = "delivery_apartment")),
            @AttributeOverride(name = "latitude", column = @Column(name = "delivery_latitude")),
            @AttributeOverride(name = "longitude", column = @Column(name = "delivery_longitude"))
    })
    private Address deliveryAddress;
    @Column(nullable = false)
    private String storeId; // Ex: RESTO_001 ou PHARMA_002
    private Double discountPercentage = 0.0; // Par défaut 0%
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> items;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;
    private boolean isPaid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        orderRef = generateBookingRef();
        if (status == null) {
            status = OrderStatus.PENDING;
        }
    }
    private String generateBookingRef() {
        // Timestamp
        String timestamp = java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .format(LocalDateTime.now());

        // Random 3 digits
        int randomDigits = (int)(Math.random() * 900) + 100; // 100 → 999

        return "SV" + timestamp + randomDigits;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addItem(OrderItem item) {
        if (items == null) {
            items = new ArrayList<>();
        }
        items.add(item);
        item.setOrder(this); // La magie est ici
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}
