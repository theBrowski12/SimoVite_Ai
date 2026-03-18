package cf.catalog_service.dto.supermarket;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import cf.catalog_service.enums.SupermarketCategory;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SupermarketRequestDTO extends CatalogRequestDto {
    private double weightInKg; // Poids du produit
    private List<SupermarketCategory> supermarketCategories;
}
