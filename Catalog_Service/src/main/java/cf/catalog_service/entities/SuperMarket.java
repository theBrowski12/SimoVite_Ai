package cf.catalog_service.entities;

import cf.catalog_service.enums.SupermarketCategory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.TypeAlias;

import java.util.List;

@TypeAlias("SUPERMARKET")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SuperMarket extends Catalog {
    private Double weightInKg; // Poids du produit
    private List<SupermarketCategory> supermarketCategories;
}
