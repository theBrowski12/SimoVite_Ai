package cf.order_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pricing_config")
@Data // Génère automatiquement les Getters, Setters, toString, etc.
@NoArgsConstructor
@AllArgsConstructor
public class PricingConfig {

    @Id
    private Long id = 1L; // On force l'ID à 1 car c'est une configuration unique

    private Double baseCost = 10.0;
    private Double perKm = 2.0;
    private Double rushSurcharge = 5.0;
    private Double nightDiscount = 2.0;
}
