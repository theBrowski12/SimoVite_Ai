package cf.catalog_service.mapper;

import cf.catalog_service.dto.review.ReviewRequestDto;
import cf.catalog_service.dto.review.ReviewResponseDto;
import cf.catalog_service.entities.Review;
import org.springframework.stereotype.Component;

@Component
public class ReviewMapper {

    public Review toEntity(ReviewRequestDto dto, String clientId, String clientName) {
        if (dto == null) return null;
        return Review.builder()
                .targetId(dto.getTargetId())
                .targetType(dto.getTargetType())
                .clientId(clientId)
                .clientName(clientName)
                .comment(dto.getComment())
                .rating(dto.getRating())
                .build();
    }

    public ReviewResponseDto toDto(Review entity) {
        if (entity == null) return null;
        return ReviewResponseDto.builder()
                .id(entity.getId())
                .targetId(entity.getTargetId())
                .targetType(entity.getTargetType())
                .clientId(entity.getClientId())
                .clientName(entity.getClientName())
                .comment(entity.getComment())
                .rating(entity.getRating())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
