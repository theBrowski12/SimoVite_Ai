package cf.catalog_service.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Document(collection = "stores") // Une collection distincte pour les magasins !
public class Store {

    @Id
    private String id; // L'ObjectId de MongoDB
    private String name;
    private String description;
    // Le type de magasin (Tu peux créer un Enum : RESTAURANT, PHARMACY, SUPERMARKET)
    private String category;
    // L'adresse qu'on a créée tout à l'heure, elle a parfaitement sa place ici !
    private Address address;
    // pas besoin car c'est le role admin qui va changer tout les stores
    private String ownerId;
    private String imageURL;
    private String phone;
    private boolean isOpen;
}
