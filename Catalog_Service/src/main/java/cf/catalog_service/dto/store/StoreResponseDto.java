package cf.catalog_service.dto.store;

import cf.catalog_service.dto.AddressDto;
import cf.catalog_service.enums.MainCategory;
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
    private MainCategory category;    // L'adresse qu'on a créée tout à l'heure, elle a parfaitement sa place ici !

    // L'adresse formatée pour le Front-end
    private AddressDto address;
    private String phone;
    private String imageURL;
    private String ownerId;
    //private String onwerName;
    private Boolean open;
}
