package cf.order_service.dto;

import cf.order_service.entity.Address;
import cf.order_service.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponseDto {
    private Long id;
    private String orderRef;
    private String userId;
    private String fullName;
    private Address deliveryAddress;
    private String storeId;
    private OrderStatus status;
    private BigDecimal price;
    private List<OrderItemResponseDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
