package cf.catalog_service.dto.supermarket;

import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import cf.catalog_service.enums.SupermarketCategory;
import lombok.*;

import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SupermarketResponseDTO extends CatalogResponseDto {
    private Double weightInKg; // Poids du produit
    private List<SupermarketCategory> supermarketCategories;
}
