package cf.catalog_service.dto.special;

import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SpecialDeliveryResponseDto extends CatalogResponseDto {
    private double pricePerKm;
    private double pricePerKg;
    private String requiredVehicleType;
}
