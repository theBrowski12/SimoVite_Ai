package cf.notification_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)

public class OrderEvent {
    private String eventType;
    private String orderRef;
    private String userName;
    private String email;
    private String createdAt;
    private BigDecimal totalAmount;
    private List<OrderItemEvent> items;

    // 👇 La sous-classe pour désérialiser les articles envoyés par l'Order_Service
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemEvent {
        private String productName;
        private int quantity;
        private BigDecimal unitPrice;
    }
}

