package cf.catalog_service.repository;

import cf.catalog_service.entities.Catalog;
import cf.catalog_service.entities.Store;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends MongoRepository<Store, String> {
    List<Store> findByOwnerId(String ownerId);
    List<Store> findByCategory(String category);
    List<Store> findByNameContainingIgnoreCase(String name);
    List<Store> findByIsOpenTrue();
}
