package cf.catalog_service.dto.special;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SpecialDeliveryRequestDto extends CatalogRequestDto {
    private Double pricePerKm;
    private Double pricePerKg;
    private String requiredVehicleType;

}
