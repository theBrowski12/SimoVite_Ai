package cf.catalog_service.repository;

import cf.catalog_service.entities.Catalog;
import cf.catalog_service.enums.FoodCategory;
import cf.catalog_service.enums.PharmacyCategory;
import cf.catalog_service.enums.SupermarketCategory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface CatalogRepository extends MongoRepository<Catalog, String> {

    // 1. Trouver tout le menu d'un magasin spécifique via son ID
    List<Catalog> findByStoreId(String storeId);

    // 2. Barre de recherche : Trouver un produit par son nom (en ignorant la casse)
    List<Catalog> findByNameContainingIgnoreCase(String name);

    // 3. Trouver uniquement les produits actuellement disponibles
    List<Catalog> findByAvailableTrue();


    // 4. Filtre "Budget"
    List<Catalog> findByBasePriceLessThanEqual(double maxPrice);

    // ==========================================
    // RECHERCHES DANS LES TABLEAUX (Via @Query)
    // ==========================================

    // --- FOOD ---
    @Query("{ 'foodCategories' : ?0 }")
    List<Catalog> findByFoodCategoriesContaining(FoodCategory category);

    @Query("{ 'storeId' : ?0, 'foodCategories' : ?1 }")
    List<Catalog> findByStoreIdAndFoodCategoriesContaining(String storeId, FoodCategory category);

    // --- PHARMACY ---
    @Query("{ 'pharmacyCategories' : ?0 }")
    List<Catalog> findByPharmacyCategoriesContaining(PharmacyCategory category);

    @Query("{ 'storeId' : ?0, 'pharmacyCategories' : ?1 }")
    List<Catalog> findByStoreIdAndPharmacyCategoriesContaining(String storeId, PharmacyCategory category);

    // --- SUPERMARKET ---
    @Query("{ 'supermarketCategories' : ?0 }")
    List<Catalog> findBySupermarketCategoriesContaining(SupermarketCategory category);

    @Query("{ 'storeId' : ?0, 'supermarketCategories' : ?1 }")
    List<Catalog> findByStoreIdAndSupermarketCategoriesContaining(String storeId, SupermarketCategory category);

    // ==========================================
    // RECHERCHES SPÉCIFIQUES ET MAGIQUES
    // ==========================================

    // Trouver par le grand type de produit (en utilisant l'alias MongoDB _class)
    @Query("{ '_class' : ?0 }")
    List<Catalog> findByItemType(String classAlias);

    // Trouver les plats végétariens
    @Query("{ 'isVegetarian' : true }")
    List<Catalog> findVegetarianMeals();

    // Trouver les médicaments qui nécessitent une ordonnance
    @Query("{ 'requiresPrescription' : true }")
    List<Catalog> findPrescriptionDrugs();

    List<Catalog> id(String id);
}
