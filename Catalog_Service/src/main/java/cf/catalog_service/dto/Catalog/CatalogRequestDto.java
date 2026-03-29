package cf.catalog_service.dto.Catalog;

import cf.catalog_service.dto.AddressDto;
import cf.catalog_service.dto.pharmacy.PharmacyRequestDto;
import cf.catalog_service.dto.resto.RestaurantRequestDto;
import cf.catalog_service.dto.special.SpecialDeliveryRequestDto;
import cf.catalog_service.dto.supermarket.SupermarketRequestDTO;
import cf.catalog_service.entities.Store;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;
import org.springframework.data.annotation.Transient;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = RestaurantRequestDto.class, name = "RESTAURANT"),
        @JsonSubTypes.Type(value = PharmacyRequestDto.class, name = "PHARMACY"),
        @JsonSubTypes.Type(value = SupermarketRequestDTO.class, name = "SUPERMARKET"),
        @JsonSubTypes.Type(value = SpecialDeliveryRequestDto.class, name = "SPECIAL_DELIVERY")
})
public abstract class CatalogRequestDto {
    private String name;
    private String description;
    private Double basePrice;
    private Boolean available;
    private String storeId;

    @JsonProperty("imageURL")
    private String imageURL;

}
