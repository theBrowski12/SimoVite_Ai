package cf.catalog_service.repository;

import cf.catalog_service.entities.Review;
import cf.catalog_service.enums.ReviewTargetType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByTargetIdAndTargetType(String targetId, ReviewTargetType targetType);
    double findAverageRatingByTargetId(String targetId);
    boolean existsByTargetIdAndClientId(String targetId, String clientId);
    // Ajoute ceci pour filtrer uniquement par type (STORE ou PRODUCT)
    List<Review> findByTargetType(ReviewTargetType targetType);

    List<Review> findByTargetId(String targetId);
}
