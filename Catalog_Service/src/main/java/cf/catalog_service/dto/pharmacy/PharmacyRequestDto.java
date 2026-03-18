package cf.catalog_service.dto.pharmacy;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import cf.catalog_service.enums.PharmacyCategory;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PharmacyRequestDto extends CatalogRequestDto {
    private boolean requiresPrescription;
    private String dosage;
    private String activeIngredient;
    private List<PharmacyCategory> pharmacyCategories;
}
