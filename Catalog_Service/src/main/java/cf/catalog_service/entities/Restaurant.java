package cf.catalog_service.entities;

import cf.catalog_service.enums.FoodCategory;
import lombok.*;
import org.springframework.data.annotation.TypeAlias;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true) // Hérite correctement de Catalog
@TypeAlias("restaurant_item")
public class Restaurant extends Catalog {
    private List<FoodCategory> foodCategories;
    private List<MenuItemExtra> availableExtras;
    private List<String> ingredients;
    private boolean isVegetarian;
    private String allergens; // Ex: "Arachides, Lait"

}
