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

    private double pricePerKm= 2.0; // Ex: 2.0 MAD / km
    private double pricePerKg= 5.0; // Ex: 1.5 MAD / kg
    private String requiredVehicleType; // Ex: "MOTO", "CAR"

    public double calculatePrice(double distanceKm, double weightKg) {
        return this.getBasePrice() + (distanceKm * this.pricePerKm) + (weightKg * this.pricePerKg);
    }
}
