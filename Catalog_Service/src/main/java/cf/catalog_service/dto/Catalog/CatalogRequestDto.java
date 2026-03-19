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
public abstract class CatalogRequestDto {
    private String name;
    private String description;
    private double basePrice;
    private boolean available;
    private String storeId;
}
