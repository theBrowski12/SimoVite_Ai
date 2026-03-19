package cf.catalog_service.dto.store;

import cf.catalog_service.dto.AddressDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
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
