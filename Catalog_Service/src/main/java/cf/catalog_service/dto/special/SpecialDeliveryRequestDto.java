package cf.catalog_service.dto.special;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SpecialDeliveryRequestDto extends CatalogRequestDto {
    private double pricePerKm;
    private double pricePerKg;
    private String requiredVehicleType;
}
