package cf.catalog_service.repository;

import cf.catalog_service.entities.Review;
import cf.catalog_service.enums.ReviewTargetType;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {

    // Recherches existantes
    List<Review> findByTargetIdAndTargetType(String targetId, ReviewTargetType targetType);

    List<Review> findByTargetType(ReviewTargetType targetType);

    List<Review> findByTargetId(String targetId);

    long countByTargetIdAndClientId(String targetId, String clientId);


    boolean existsByTargetIdAndClientId(String targetId, String clientId);

    // ✅ Correction de la méthode pour la moyenne des notes
    @Aggregation(pipeline = {
            "{ $match: { targetId: ?0, targetType: ?1 } }",
            "{ $group: { _id: null, avgRating: { $avg: '$rating' } } }"
    })
    Optional<Double> findAverageRatingByTargetIdAndTargetType(String targetId, ReviewTargetType targetType);

    // Version alternative avec @Query (MongoDB JSON query)
    @Query(value = "{ targetId: ?0, targetType: ?1 }", fields = "{ rating: 1 }")
    List<Review> findRatingsByTargetIdAndTargetType(String targetId, ReviewTargetType targetType);

    // Récupérer les reviews avec un sentiment spécifique
    List<Review> findByTargetIdAndTargetTypeAndSentiment(String targetId, ReviewTargetType targetType, String sentiment);

    // Récupérer les reviews incohérentes
    List<Review> findByIncoherentTrue();

    // Compter les reviews par sentiment
    long countByTargetIdAndTargetTypeAndSentiment(String targetId, ReviewTargetType targetType, String sentiment);
}
