package cf.catalog_service.api;

import cf.catalog_service.dto.review.ReviewRequestDto;
import cf.catalog_service.dto.review.ReviewResponseDto;
import cf.catalog_service.enums.ReviewTargetType;
import cf.catalog_service.srevices.ReviewService;
import cf.catalog_service.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews API", description = "Avis et commentaires clients")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Ajouter un avis sur un produit ou un store")
    public ResponseEntity<ReviewResponseDto> addReview(@RequestBody ReviewRequestDto dto) {
        String clientId   = JwtUtils.getUserId();
        String clientName = JwtUtils.getFullName();
        return new ResponseEntity<>(reviewService.addReview(dto, clientId, clientName), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Récupérer les avis d'un produit ou d'un store")
    public ResponseEntity<List<ReviewResponseDto>> getReviews(
            @RequestParam String targetId,
            @RequestParam ReviewTargetType targetType) {
        return ResponseEntity.ok(reviewService.getReviews(targetId, targetType));
    }

    @GetMapping("/rating")
    @Operation(summary = "Note moyenne d'un produit ou d'un store")
    public ResponseEntity<Double> getAverageRating(
            @RequestParam String targetId,
            @RequestParam ReviewTargetType targetType) {
        return ResponseEntity.ok(reviewService.getAverageRating(targetId, targetType));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    @Operation(summary = "Supprimer un avis (auteur ou ADMIN)")
    public ResponseEntity<Void> deleteReview(@PathVariable String id) {
        String clientId = JwtUtils.getUserId();
        reviewService.deleteReview(id, clientId);
        return ResponseEntity.noContent().build();
    }
}
