package cf.delivery_service.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    private String city;           // Ville
    private String street;         // Rue
    private String buildingNumber; // N° (Bâtiment)
    private String apartment;      // Appartement (Optionnel)
    private Double latitude;
    private Double longitude;
}
