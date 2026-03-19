package cf.catalog_service.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Document(collection = "catalog_offerings") // C'est l'équivalent NoSQL de @Entity
public class Catalog {

    @Id
    private String id; // Changé de Long à String pour que MongoDB génère l'ObjectId automatiquement

    private String name;
    private String description;
    private Double basePrice;
    private Boolean available;
    private String imageURL;
    private String storeId;
    @Transient
    private Store store;
}
