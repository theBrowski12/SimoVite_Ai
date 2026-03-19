package cf.catalog_service.entities;

import cf.catalog_service.enums.PharmacyCategory;
import lombok.*;
import org.springframework.data.annotation.TypeAlias;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TypeAlias("pharmacy_item")
public class Pharmacy extends Catalog {

    private Boolean requiresPrescription; // Vrai si besoin d'une ordonnance
    private String dosage; // Ex: "500mg"
    private String activeIngredient; // Ex: "Paracétamol"
    private List<PharmacyCategory> pharmacyCategories;
}
