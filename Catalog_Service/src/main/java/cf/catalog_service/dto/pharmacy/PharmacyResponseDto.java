package cf.catalog_service.dto.pharmacy;

import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import cf.catalog_service.enums.PharmacyCategory;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PharmacyResponseDto extends CatalogResponseDto {
    private Boolean requiresPrescription;
    private String dosage;
    private String activeIngredient;
    private List<PharmacyCategory> pharmacyCategories;
}
