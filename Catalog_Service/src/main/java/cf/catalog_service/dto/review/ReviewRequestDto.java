package cf.catalog_service.dto.review;

import cf.catalog_service.enums.ReviewTargetType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// ReviewRequestDto.java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequestDto {
    private String targetId;
    private ReviewTargetType targetType; // PRODUCT ou STORE
    private String comment;
    private Double rating;           // 1 à 5
}
