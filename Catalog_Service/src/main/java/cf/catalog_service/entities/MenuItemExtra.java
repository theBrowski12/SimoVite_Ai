package cf.catalog_service.entities;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemExtra {
    private String name; // Ex: "Cheesy crust", "Extra mayo"
    private double additionalPrice; // Ex: 15.0, 5.0 (ou 0.0 si c'est gratuit)
}
