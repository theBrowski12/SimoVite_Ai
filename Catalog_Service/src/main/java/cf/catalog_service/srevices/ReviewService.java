package cf.catalog_service.srevices;

import cf.catalog_service.dto.review.ReviewRequestDto;
import cf.catalog_service.dto.review.ReviewResponseDto;
import cf.catalog_service.enums.ReviewTargetType;

import java.util.List;

// ReviewService.java
public interface ReviewService {
    ReviewResponseDto addReview(ReviewRequestDto dto, String clientId, String clientName);
    List<ReviewResponseDto> getReviews(String targetId, ReviewTargetType targetType);
    Double getAverageRating(String targetId, ReviewTargetType targetType);
    ReviewResponseDto updateReview(String reviewId, ReviewRequestDto dto, String clientId, String clientName);
    void deleteReview(String reviewId, String clientId);
}
