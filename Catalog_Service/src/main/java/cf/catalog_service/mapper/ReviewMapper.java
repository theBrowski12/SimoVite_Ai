package cf.catalog_service.mapper;

import cf.catalog_service.dto.review.ReviewRequestDto;
import cf.catalog_service.dto.review.ReviewResponseDto;
import cf.catalog_service.entities.Review;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ReviewMapper {

    public Review toEntity(ReviewRequestDto dto, String clientId, String clientName) {
        if (dto == null) {
            return null;
        }

        Review entity = new Review();

        // Copie les propriétés simples (targetId, targetType, comment, rating)
        BeanUtils.copyProperties(dto, entity);

        // Ajout manuel des champs venant du JWT
        entity.setClientId(clientId);
        entity.setClientName(clientName);

        return entity;
    }

    /**
     * Convertit l'entité Review en ReviewResponseDto
     */
    public ReviewResponseDto toDto(Review entity) {
        if (entity == null) {
            return null;
        }

        ReviewResponseDto dto = new ReviewResponseDto();

        // Copie automatiquement TOUTES les propriétés avec les mêmes noms
        // Cela inclut: id, targetId, targetType, clientId, clientName,
        // comment, rating, sentiment, sentimentScore, sentimentAnalyzed, createdAt
        BeanUtils.copyProperties(entity, dto);

        log.debug("✅ Review mapped successfully: id={}, sentiment={}, score={}",
                entity.getId(), entity.getSentiment(), entity.getSentimentScore());

        return dto;
    }
}
