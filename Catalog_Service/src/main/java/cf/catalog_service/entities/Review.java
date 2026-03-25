package cf.catalog_service.entities;

import cf.catalog_service.enums.ReviewTargetType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

// Review.java
@Document(collection = "reviews")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Review {
    @Id
    private String id;
    private String targetId;      // productId ou storeId
    private ReviewTargetType targetType; // PRODUCT ou STORE
    private String clientId;      // JWT sub
    private String clientName;    // JWT given_name + family_name
    private String comment;
    private Double rating;           // 1 à 5

    private String sentiment;        // POSITIVE / NEGATIVE / MIXED
    private Double sentimentScore;   // 0.0 à 1.0
    private Boolean sentimentAnalyzed;
    private Boolean incoherent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
