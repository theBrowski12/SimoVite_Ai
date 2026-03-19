package cf.catalog_service.dto.Catalog;

import cf.catalog_service.dto.pharmacy.PharmacyResponseDto;
import cf.catalog_service.dto.resto.RestaurantResponseDto;
import cf.catalog_service.dto.special.SpecialDeliveryResponseDto;
import cf.catalog_service.dto.store.StoreResponseDto;
import cf.catalog_service.dto.supermarket.SupermarketResponseDTO;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = RestaurantResponseDto.class, name = "RESTAURANT"),
        @JsonSubTypes.Type(value = PharmacyResponseDto.class, name = "PHARMACY"),
        @JsonSubTypes.Type(value = SupermarketResponseDTO.class, name = "SUPERMARKET"),
        @JsonSubTypes.Type(value = SpecialDeliveryResponseDto.class, name = "DELIVERY")
})public abstract class CatalogResponseDto {
    private String id; // L'ID est présent dans la réponse !
    private String name;
    private String description;
    private double basePrice;
    private boolean available;

  // On ajoute un champ type explicite pour aider le Front-end (React/Angular)
    private String type;
    private String storeId;
    private String imageURL;
    private StoreResponseDto store;
}
