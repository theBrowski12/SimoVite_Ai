package cf.catalog_service.entities;

import lombok.*;
import org.springframework.data.annotation.TypeAlias;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@TypeAlias("delivery_service")
public class SpecialDelivery extends Catalog {

    private Double pricePerKm= 2.0; // Ex: 2.0 MAD / km
    private Double pricePerKg= 5.0; // Ex: 1.5 MAD / kg
    private String requiredVehicleType; // Ex: "MOTO", "CAR"

    public Double calculatePrice(double distanceKm, double weightKg) {
        return this.getBasePrice() + (distanceKm * this.pricePerKm) + (weightKg * this.pricePerKg);
    }
}
