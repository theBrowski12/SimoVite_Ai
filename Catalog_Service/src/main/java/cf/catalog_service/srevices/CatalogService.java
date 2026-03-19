package cf.catalog_service.srevices;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import cf.catalog_service.dto.pharmacy.PharmacyRequestDto;
import cf.catalog_service.dto.resto.RestaurantRequestDto;
import cf.catalog_service.dto.special.SpecialDeliveryRequestDto;
import cf.catalog_service.dto.supermarket.SupermarketRequestDTO;
import cf.catalog_service.enums.FoodCategory;
import cf.catalog_service.enums.PharmacyCategory;
import cf.catalog_service.enums.SupermarketCategory;
import org.springaicommunity.mcp.annotation.McpToolParam;

import java.util.List;

public interface CatalogService {

    // CRUD de base
    CatalogResponseDto createRestaurantItem(RestaurantRequestDto requestDto);
    CatalogResponseDto createPharmacyItem(PharmacyRequestDto requestDto);
    CatalogResponseDto createSupermarketItem(SupermarketRequestDTO requestDto);
    CatalogResponseDto createDeliveryService(SpecialDeliveryRequestDto requestDto);
    double calculateDeliveryPrice(String deliveryId,Double distanceKm,Double weightKg);
    CatalogResponseDto createOffer(CatalogRequestDto requestDto);
    CatalogResponseDto getOfferById(String id);
    List<CatalogResponseDto> getAllOffers();
    CatalogResponseDto updateOffer(String id, CatalogRequestDto requestDto);
    void deleteOffer(String id);
    CatalogResponseDto toggleAvailability(String productId, String requestingOwnerId);
    // Recherches spécifiques pour le Front-end
    List<CatalogResponseDto> getOffersByProviderId(String providerId);
    List<CatalogResponseDto> searchOffersByName(String name);
    List<CatalogResponseDto> getAvailableOffers();

    // Filtres avancés par catégories globales (Toute l'app)
    List<CatalogResponseDto> getOffersByFoodCategory(FoodCategory category);
    List<CatalogResponseDto> getOffersByPharmacyCategory(PharmacyCategory category);
    List<CatalogResponseDto> getOffersBySupermarketCategory(SupermarketCategory category);

    // Récupérer tous les produits d'un grand type (ex: RESTAURANT, PHARMACY)
    List<CatalogResponseDto> getProductsByMainType(String mainType);

    // Filtres avancés par catégories POUR UN MAGASIN PRÉCIS (Ex: Menu d'un resto)
    List<CatalogResponseDto> getStoreOffersByFoodCategory(String storeId, FoodCategory category);
    List<CatalogResponseDto> getStoreOffersByPharmacyCategory(String storeId, PharmacyCategory category);
    List<CatalogResponseDto> getStoreOffersBySupermarketCategory(String storeId, SupermarketCategory category);
}
