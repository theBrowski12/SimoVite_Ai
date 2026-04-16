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
@Builder
public class OrderEvent {
    private String eventType;    // "ORDER_CREATED", "ORDER_PAID", etc.
    private String orderRef;
    private String orderType;    // 👈 NEW: "REGULAR" or "SPECIAL_DELIVERY"

    // Core Customer Info
    private String userName;
    private String email;

    // Financials
    private BigDecimal totalAmount;
    private BigDecimal deliveryCost;
    private boolean cashOnDelivery;

    // Addresses
    private Address deliveryAddress; // This is the Drop-off location
    private Address pickUpAddress;   // 👈 NEW: Required for C2C Special Deliveries!

    // Logistics & Store (For Regular Orders / Catalog categorization)
    private String storeId;
    private String storeCategory;

    // 📦 Special Delivery Info (Nullable for food orders)
    private String productName;      // 👈 NEW: What is the courier carrying?
    private Double totalWeightKg;    // 👈 NEW: Is it heavy?
    private String instructions;     // 👈 NEW: "Handle with care"

    // 📞 Contacts for Courier
    private String senderName;       // 👈 NEW
    private String senderPhone;      // 👈 NEW
    private String receiverName;     // 👈 NEW
    private String receiverPhone;    // 👈 NEW

    // Items (For food/pharmacy orders, will be null/empty for Special Delivery)
    private List<OrderItemEvent> items;

    private String createdAt;
    private String message;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItemEvent {
        private String productName;
        private int quantity;
        private BigDecimal unitPrice;
    }
}
