package cf.order_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private String productId; // L'ID du produit dans MongoDB (Catalog)

    private String productName; // Garder le nom est utile si le produit est supprimé du catalogue plus tard

    private int quantity;

    private BigDecimal unitPrice;
}
