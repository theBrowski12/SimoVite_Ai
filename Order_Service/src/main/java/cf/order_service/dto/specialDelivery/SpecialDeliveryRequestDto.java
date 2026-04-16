package cf.order_service.dto.specialDelivery;

import cf.order_service.dto.AddressDto;
import cf.order_service.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpecialDeliveryRequestDto {

    // 1. What service is being used (fetches price/vehicle from Catalog_Service)
    private String catalogSpecialDeliveryId; // ID of the delivery offer in catalog

    // 2. Package info
    private String productName;        // e.g., "Laptop", "Guitar", "Mattress"
    private Double totalWeightKg;
    private List<String> productPhotoUrls;
    private String instructions;       // e.g., "Fragile, handle with care"

    // 3. Delivery company (from Catalog_Service stores)
    private String storeId;            // delivery company branch ID

    // 4. Addresses
    private AddressDto pickupAddress;  // Point A — where to pick up
    private AddressDto dropoffAddress; // Point B — where to deliver

    // 5. Sender info (can be pre-filled from JWT but kept explicit)
    private String senderName;
    private String senderPhone;

    // 6. Receiver info
    private String receiverName;
    private String receiverPhone;

    // 7. Payment
    private PaymentMethod paymentMethod;
}
