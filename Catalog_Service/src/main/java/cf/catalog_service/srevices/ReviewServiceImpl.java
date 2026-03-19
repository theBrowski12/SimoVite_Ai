package cf.catalog_service.srevices;

import cf.catalog_service.dto.review.ReviewRequestDto;
import cf.catalog_service.dto.review.ReviewResponseDto;
import cf.catalog_service.entities.Review;
import cf.catalog_service.enums.ReviewTargetType;
import cf.catalog_service.mapper.ReviewMapper;
import cf.catalog_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;

    @Override
    @McpTool(description = "Add a review (rating + comment) for a product or store. CLIENT only. One review per target per client. Rating: 1.0 to 5.0")
    public ReviewResponseDto addReview(
            @McpToolParam(description = "Review data: targetId (MongoDB ObjectId), targetType (PRODUCT|STORE), comment, rating (1.0-5.0)") ReviewRequestDto dto,
            @McpToolParam(description = "Keycloak UUID of the client (from JWT sub)") String clientId,
            @McpToolParam(description = "Full name of the client (from JWT given_name + family_name)") String clientName) {
        if (reviewRepository.existsByTargetIdAndClientId(dto.getTargetId(), clientId))
            throw new RuntimeException("Vous avez déjà laissé un avis pour cet élément !");
        if (dto.getRating() == null || dto.getRating() < 1.0 || dto.getRating() > 5.0)
            throw new RuntimeException("La note doit être entre 1 et 5 !");
        Review review = reviewMapper.toEntity(dto, clientId, clientName);
        review.setCreatedAt(LocalDateTime.now());
        return reviewMapper.toDto(reviewRepository.save(review));
    }

    @Override
    @McpTool(description = "Get all reviews for a specific product or store. targetType: PRODUCT or STORE")
    public List<ReviewResponseDto> getReviews(
            @McpToolParam(description = "MongoDB ObjectId of the product or store") String targetId,
            @McpToolParam(description = "Target type: PRODUCT | STORE") ReviewTargetType targetType) {
        return reviewRepository.findByTargetIdAndTargetType(targetId, targetType)
                .stream().map(reviewMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get the average rating (1.0-5.0) of a product or store based on all reviews")
    public Double getAverageRating(
            @McpToolParam(description = "MongoDB ObjectId of the product or store") String targetId,
            @McpToolParam(description = "Target type: PRODUCT | STORE") ReviewTargetType targetType) {
        return reviewRepository.findByTargetIdAndTargetType(targetId, targetType)
                .stream().mapToDouble(Review::getRating).average().orElse(0.0);
    }

    @Override
    @McpTool(description = "[CLIENT / ADMIN ONLY] Delete a review by ID. CLIENT can only delete their own reviews. ADMIN can delete any.")
    public void deleteReview(
            @McpToolParam(description = "MongoDB ObjectId of the review to delete") String reviewId,
            @McpToolParam(description = "Keycloak UUID of the requesting client (from JWT sub)") String clientId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review introuvable : " + reviewId));
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !review.getClientId().equals(clientId))
            throw new RuntimeException("❌ Accès refusé !");
        reviewRepository.deleteById(reviewId);
    }
}
