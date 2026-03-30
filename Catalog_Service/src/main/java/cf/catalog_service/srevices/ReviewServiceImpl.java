package cf.catalog_service.srevices;

import cf.catalog_service.dto.review.ReviewRequestDto;
import cf.catalog_service.dto.review.ReviewResponseDto;
import cf.catalog_service.dto.sentiment.SentimentRequest;
import cf.catalog_service.dto.sentiment.SentimentResponse;
import cf.catalog_service.entities.Review;
import cf.catalog_service.enums.ReviewTargetType;
import cf.catalog_service.feignClients.SentimentFeignClient;
import cf.catalog_service.mapper.ReviewMapper;
import cf.catalog_service.repository.CatalogRepository;
import cf.catalog_service.repository.ReviewRepository;
import cf.catalog_service.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;
    private final SentimentFeignClient sentimentFeignClient;
    private final CatalogRepository productRepository;
    private final StoreRepository storeRepository;

    @Override
    @Transactional
    @McpTool(description = "Add a review (rating + comment) for a product or store. CLIENT only. One review per target per client. Rating: 1.0 to 5.0")
    public ReviewResponseDto addReview(
            @McpToolParam(description = "Review data") ReviewRequestDto dto,
            @McpToolParam(description = "Keycloak UUID of the client") String clientId,
            @McpToolParam(description = "Full name of the client") String clientName) {

        // Vérifications
        long reviewCount = reviewRepository.countByTargetIdAndClientId(dto.getTargetId(), clientId);
        if (reviewCount >= 5) {
            throw new RuntimeException("Vous avez déjà laissé 5 avis pour cet élément. Maximum atteint !");
        }
        if (dto.getRating() == null || dto.getRating() < 1.0 || dto.getRating() > 5.0) {
            throw new RuntimeException("La note doit être entre 1 et 5 !");
        }

        // Création
        Review review = reviewMapper.toEntity(dto, clientId, clientName);
        review.setCreatedAt(LocalDateTime.now());
        review.setSentimentAnalyzed(false);
        review.setIncoherent(false);

        Review savedReview = reviewRepository.save(review);
        log.info("📝 Review created with id: {}", savedReview.getId());

        // Analyse sentiment
        savedReview = analyzeAndUpdateSentiment(savedReview, dto);

        return reviewMapper.toDto(savedReview);
    }

    @Override
    @McpTool(description = "Update an existing review. CLIENT can only update their own reviews.")
    @Transactional
    public ReviewResponseDto updateReview(
            @McpToolParam(description = "ID of the review to update") String reviewId,
            @McpToolParam(description = "Updated review data") ReviewRequestDto dto,
            @McpToolParam(description = "Keycloak UUID of the client") String clientId,
            @McpToolParam(description = "Full name of the client") String clientName) {

        log.info("📝 Updating review {} for client {}", reviewId, clientName);

        // Vérifications
        Review existingReview = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review introuvable: " + reviewId));

        if (!existingReview.getClientId().equals(clientId)) {
            throw new RuntimeException("❌ Vous ne pouvez modifier que vos propres avis !");
        }

        if (dto.getRating() == null || dto.getRating() < 1.0 || dto.getRating() > 5.0) {
            throw new RuntimeException("La note doit être entre 1 et 5 !");
        }

        // Mise à jour
        existingReview.setComment(dto.getComment());
        existingReview.setRating(dto.getRating());
        existingReview.setUpdatedAt(LocalDateTime.now());
        existingReview.setSentimentAnalyzed(false);
        existingReview.setSentiment(null);
        existingReview.setSentimentScore(null);
        existingReview.setIncoherent(false);

        // Analyse sentiment
        Review updatedReview = analyzeAndUpdateSentiment(existingReview, dto);

        log.info("✅ Review {} updated successfully", reviewId);
        return reviewMapper.toDto(updatedReview);
    }

    @Override
    @McpTool(description = "Get reviews. Leave parameters empty to get ALL reviews.")
    public List<ReviewResponseDto> getReviews(
            @McpToolParam(description = "Target ID (optional)") String targetId,
            @McpToolParam(description = "Target type (optional)") ReviewTargetType targetType) {

        List<Review> reviews;

        if (targetId != null && !"all".equalsIgnoreCase(targetId) && targetType != null) {
            reviews = reviewRepository.findByTargetIdAndTargetType(targetId, targetType);
        } else if (targetType != null && (targetId == null || "all".equalsIgnoreCase(targetId))) {
            reviews = reviewRepository.findByTargetType(targetType);
        } else if (targetId != null && !"all".equalsIgnoreCase(targetId)) {
            reviews = reviewRepository.findByTargetId(targetId);
        } else {
            reviews = reviewRepository.findAll();
        }

        return reviews.stream()
                .map(review -> {
                    ReviewResponseDto dto = reviewMapper.toDto(review);
                    // On va chercher le nom directement en base de données
                    dto.setTargetName(fetchTargetName(review.getTargetId(), review.getTargetType()));
                    return dto;
                })
                .toList();
    }
    private String fetchTargetName(String targetId, ReviewTargetType type) {
        if (targetId == null || type == null) return "—";

        try {
            if (type == ReviewTargetType.PRODUCT) {
                return productRepository.findById(targetId)
                        .map(product -> product.getName()) // ⚠️ Remplace getName() par le vrai nom de ton getter (ex: getTitle())
                        .orElse("Produit supprimé");

            } else if (type == ReviewTargetType.STORE) {
                return storeRepository.findById(targetId)
                        .map(store -> store.getName()) // ⚠️ Remplace getName() par le vrai nom de ton getter
                        .orElse("Magasin fermé/supprimé");
            }
            return "—";

        } catch (Exception e) {
            log.error("Impossible de récupérer le nom pour targetId {} de type {}: {}", targetId, type, e.getMessage());
            return "Erreur d'affichage";
        }
    }
    @Override
    @McpTool(description = "Get average rating (1.0-5.0) of a product or store")
    public Double getAverageRating(
            @McpToolParam(description = "Target ID") String targetId,
            @McpToolParam(description = "Target type") ReviewTargetType targetType) {
        Optional<Double> average = reviewRepository.findAverageRatingByTargetIdAndTargetType(targetId, targetType);

        return average.orElse(0.0);
    }

    @Override
    @Transactional
    @McpTool(description = "Delete a review by ID. CLIENT can only delete their own reviews.")
    public void deleteReview(
            @McpToolParam(description = "Review ID") String reviewId,
            @McpToolParam(description = "Client ID from JWT") String clientId) {

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review introuvable: " + reviewId));

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !review.getClientId().equals(clientId)) {
            throw new RuntimeException("❌ Accès refusé !");
        }

        reviewRepository.deleteById(reviewId);
        log.info("🗑️ Review {} deleted by {}", reviewId, clientId);
    }

    /**
     * Analyse le sentiment et met à jour la review
     */
    private Review analyzeAndUpdateSentiment(Review review, ReviewRequestDto dto) {
        if (dto.getComment() == null || dto.getComment().isBlank()) {
            log.info("📝 No comment for review {}, skipping sentiment analysis", review.getId());
            review.setSentimentAnalyzed(false);
            return review;
        }

        log.info("📊 Analyzing sentiment for review {}: '{}'",
                review.getId(),
                dto.getComment().substring(0, Math.min(50, dto.getComment().length())));

        try {
            SentimentRequest sentimentRequest = SentimentRequest.builder()
                    .comment(dto.getComment())
                    .rating(dto.getRating())
                    .build();

            long startTime = System.currentTimeMillis();
            SentimentResponse sentiment = sentimentFeignClient.analyzeSentiment(sentimentRequest);
            long duration = System.currentTimeMillis() - startTime;

            log.info("⏱️ Sentiment analysis completed in {}ms", duration);
            log.info("✅ Result: {} (score: {:.2f}, confidence: {:.2f})",
                    sentiment.getSentiment(),
                    sentiment.getScore(),
                    sentiment.getConfidence());

            // Mettre à jour la review
            review.setSentiment(sentiment.getSentiment());
            review.setSentimentScore(sentiment.getScore());
            review.setSentimentAnalyzed(true);
            review.setIncoherent(Boolean.TRUE.equals(sentiment.getIncoherent()));

            if (Boolean.TRUE.equals(sentiment.getIncoherent())) {
                log.warn("🚨 INCOHERENCE: rating={} but sentiment={} - {}",
                        dto.getRating(), sentiment.getSentiment(), sentiment.getAlert());
            }

            review = reviewRepository.save(review);
            log.info("💾 Review {} updated with sentiment data", review.getId());

        } catch (Exception e) {
            log.error("❌ Sentiment Service error for review {}: {}", review.getId(), e.getMessage());
            review.setSentimentAnalyzed(false);
            review.setIncoherent(false);
        }

        return review;
    }
}
