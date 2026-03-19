package cf.catalog_service.dto.resto;

import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import cf.catalog_service.entities.MenuItemExtra;
import cf.catalog_service.enums.FoodCategory;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RestaurantResponseDto extends CatalogResponseDto {
    private List<FoodCategory> foodCategories;
    private List<MenuItemExtra> availableExtras;
    private List<String> ingredients;
    private Boolean vegetarian;
    private String allergens;
}
