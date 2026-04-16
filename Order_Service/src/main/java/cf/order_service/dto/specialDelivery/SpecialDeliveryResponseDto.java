package cf.order_service.dto.specialDelivery;

import cf.order_service.dto.OrderResponseDto;
import cf.order_service.entity.Address;
import cf.order_service.enums.OrderStatus;
import cf.order_service.enums.PaymentMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecialDeliveryResponseDto {
    private Long id;
    private String orderRef;
    private OrderStatus status;

    // Package Info
    private String productName;
    private Double totalWeightKg;
    private List<String> productPhotoUrls;
    private String instructions;

    // Addresses
    private Address pickUpAddress;
    private Address deliveryAddress;
    private Double calculatedDistanceKm;

    // Logistics & Store
    private String storeId;
    private String storeName;
    private String storeCategory;
    private String storePhone;

    // People
    private String senderName;
    private String senderPhone;
    private String receiverName;
    private String receiverPhone;

    // Money
    private BigDecimal deliveryCost;
    private BigDecimal price;
    private PaymentMethod paymentMethod;


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
