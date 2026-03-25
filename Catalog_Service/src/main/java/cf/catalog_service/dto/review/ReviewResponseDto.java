package cf.catalog_service.dto.review;

import cf.catalog_service.enums.ReviewTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// ReviewResponseDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseDto {
    private String id;
    private String targetId;
    private ReviewTargetType targetType;
    private String clientId;
    private String clientName;
    private String comment;
    private Double rating;           // 1 à 5
    private String sentiment;          // POSITIVE / NEGATIVE / MIXED
    private Double sentimentScore;     // 0.0 à 1.0
    private Boolean sentimentAnalyzed;
    private Boolean incoherent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
