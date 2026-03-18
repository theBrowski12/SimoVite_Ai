package cf.catalog_service.dto.store;

import cf.catalog_service.dto.AddressDto;
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
    private String category;

    // On utilise bien le DTO ici !
    private AddressDto address;

    // L'ID Keycloak du gérant (optionnel au moment de la création si c'est géré par le token)
    private String ownerId;

    private String phone;

    private String imageURL;
    private boolean Open;
}
