package cf.catalog_service.dto.resto;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
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
public class RestaurantRequestDto extends CatalogRequestDto {
    private List<FoodCategory> foodCategories;
    private List<MenuItemExtra> availableExtras;
    private List<String> ingredients;
    private boolean Vegetarian;
    private String allergens;
}
