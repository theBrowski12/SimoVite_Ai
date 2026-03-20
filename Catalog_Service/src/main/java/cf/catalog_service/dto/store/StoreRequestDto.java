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
public class StoreRequestDto {
    private String name;
    private String description;

    // Ex: RESTAURANT, PHARMACY, SUPERMARKET
    private MainCategory category;    // L'adresse qu'on a créée tout à l'heure, elle a parfaitement sa place ici !

    // On utilise bien le DTO ici !
    private AddressDto address;

    private String phone;

    private String imageURL;
    private Boolean open;
}
