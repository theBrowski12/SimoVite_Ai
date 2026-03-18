package cf.order_service.dto;

import cf.order_service.entity.Address;
import cf.order_service.enums.PaymentMethod;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequestDto {
    private String userId;
    private String fullName;
    private Address deliveryAddress;
    private String storeId;
    private PaymentMethod paymentMethod;
    private Boolean isPaid;
    private List<OrderItemRequestDto> items;
}
