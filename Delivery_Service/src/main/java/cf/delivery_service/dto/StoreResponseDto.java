package cf.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponseDto {
    private String id; // L'ID MongoDB généré
    private String name;
    private String description;
    private String category;

    // L'adresse formatée pour le Front-end
    private AddressDto address;
    private String phone;
    private String imageURL;
    private String ownerId;
    private Boolean open;
}
