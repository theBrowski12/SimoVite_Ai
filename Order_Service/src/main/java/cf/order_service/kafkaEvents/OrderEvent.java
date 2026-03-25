package cf.order_service.kafkaEvents;

import cf.order_service.entity.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder // Pratique pour créer l'objet rapidement
public class OrderEvent {
    private String eventType;    // Pour "ORDER_CREATED", "ORDER_UPDATED", etc.
    private String orderRef;
    private String userName;     // Correspond à customerName
    private String email;        // Correspond à customerEmail
    private BigDecimal totalAmount;
    private List<OrderItemEvent> items;
    private String createdAt;
    private String message;      // Optionnel : pour un texte personnalisé
    private boolean cashOnDelivery;
    private Address deliveryAddress;
    private String storeId;
    private String storeCategory;
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItemEvent {
        private String productName;
        private int quantity;
        private BigDecimal unitPrice;
    }
}
