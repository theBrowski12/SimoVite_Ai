package cf.catalog_service.srevices;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import cf.catalog_service.dto.pharmacy.PharmacyRequestDto;
import cf.catalog_service.dto.resto.RestaurantRequestDto;
import cf.catalog_service.dto.special.SpecialDeliveryRequestDto;
import cf.catalog_service.dto.supermarket.SupermarketRequestDTO;
import cf.catalog_service.entities.Catalog;
import cf.catalog_service.entities.SpecialDelivery;
import cf.catalog_service.entities.Store;
import cf.catalog_service.enums.FoodCategory;
import cf.catalog_service.enums.PharmacyCategory;
import cf.catalog_service.enums.SupermarketCategory;
import cf.catalog_service.mapper.CatalogMapper;
import cf.catalog_service.repository.CatalogRepository;
import cf.catalog_service.repository.StoreRepository;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CatalogServiceImpl implements CatalogService {

    private final CatalogRepository catalogRepository;
    private final CatalogMapper catalogMapper;
    private final StoreRepository storeRepository;

    public CatalogServiceImpl(CatalogRepository catalogRepository, CatalogMapper catalogMapper,
                              StoreRepository storeRepository) {
        this.catalogRepository = catalogRepository;
        this.catalogMapper = catalogMapper;
        this.storeRepository = storeRepository;
    }

    @Override
    public CatalogResponseDto createOffer(CatalogRequestDto requestDto) {
        Catalog entityToSave = catalogMapper.toEntity(requestDto);
        Store store = storeRepository.findById(requestDto.getStoreId()).orElse(null);
        entityToSave.setStore(store);
        return catalogMapper.toDto(catalogRepository.save(entityToSave));
    }

    @Override
    @McpTool(description = "[ADMIN/STORE_OWNER] Add FOOD item to RESTAURANT. foodCategories: PIZZA,BURGER,SANDWICH,TACOS,ITALIAN,ASIAN,MOROCCAN,MEXICAN,FAST_FOOD,SNACKS,PROMOTION,TOP_SELLER")
    public CatalogResponseDto createRestaurantItem(
            @McpToolParam(description = "Restaurant item. Required: name,basePrice,storeId,ingredients,foodCategories") RestaurantRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @McpTool(description = "[ADMIN/STORE_OWNER] Add MEDICINE to PHARMACY. pharmacyCategories: MEDICINE,AESTHETIC,MEDICAL_EQUIPMENT,SUPPLEMENTS,BABY_CARE,HYGIENE,VISION,PROMOTION,OTHER")
    public CatalogResponseDto createPharmacyItem(
            @McpToolParam(description = "Pharmacy item. Required: name,basePrice,storeId,activeIngredient,pharmacyCategories. Optional: dosage,requiresPrescription") PharmacyRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @McpTool(description = "[ADMIN/STORE_OWNER] Add GROCERY to SUPERMARKET. supermarketCategories: BEVERAGES,DAIRY,BAKERY,MEAT,VEGETABLES,FRUITS,SNACKS,CLEANING,PERSONAL_CARE,PROMOTION,TOP_SELLER")
    public CatalogResponseDto createSupermarketItem(
            @McpToolParam(description = "Supermarket item. Required: name,basePrice,storeId,weightInKg,supermarketCategories") SupermarketRequestDTO requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @McpTool(description = "[ADMIN] Create SPECIAL DELIVERY service. Pricing: basePrice + distanceKm×pricePerKm + weightKg×pricePerKg")
    public CatalogResponseDto createDeliveryService(
            @McpToolParam(description = "Delivery service. Required: name,basePrice,storeId,pricePerKm,pricePerKg,maxWeightKg") SpecialDeliveryRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @McpTool(description = "Get product details by MongoDB ID")
    public CatalogResponseDto getOfferById(
            @McpToolParam(description = "MongoDB ObjectId (24 hex chars)") String id) {
        return catalogMapper.toDto(catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable : " + id)));
    }

    @Override
    @McpTool(description = "Get ALL products across all stores. Prefer filtered tools when possible.")
    public List<CatalogResponseDto> getAllOffers() {
        return catalogRepository.findAll().stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Update an existing product by ID")
    public CatalogResponseDto updateOffer(
            @McpToolParam(description = "MongoDB ObjectId of product to update") String id,
            @McpToolParam(description = "Updated product data") CatalogRequestDto requestDto) {
        catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable : " + id));
        Catalog updated = catalogMapper.toEntity(requestDto);
        updated.setId(id);
        return catalogMapper.toDto(catalogRepository.save(updated));
    }

    @Override
    @McpTool(description = "Permanently DELETE a product. IRREVERSIBLE — confirm before calling.")
    public void deleteOffer(
            @McpToolParam(description = "MongoDB ObjectId of product to delete") String id) {
        if (!catalogRepository.existsById(id))
            throw new RuntimeException("Produit introuvable : " + id);
        catalogRepository.deleteById(id);
    }

    @Override
    @McpTool(description = "Toggle product availability. STORE_OWNER verified, ADMIN bypasses.")
    public CatalogResponseDto toggleAvailability(
            @McpToolParam(description = "MongoDB ObjectId of product") String productId,
            @McpToolParam(description = "Keycloak UUID of requesting user (JWT sub)") String requestingOwnerId) {
        Catalog catalog = catalogRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable : " + productId));
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            Store store = storeRepository.findById(catalog.getStoreId())
                    .orElseThrow(() -> new RuntimeException("Store introuvable"));
            if (!store.getOwnerId().equals(requestingOwnerId))
                throw new RuntimeException("❌ Accès refusé !");
        }
        catalog.setAvailable(!catalog.getAvailable());
        return catalogMapper.toDto(catalogRepository.save(catalog));
    }

    @Override
    @McpTool(description = "Get all products of a specific store by storeId")
    public List<CatalogResponseDto> getOffersByProviderId(
            @McpToolParam(description = "MongoDB ObjectId of the store") String providerId) {
        return catalogRepository.findByStoreId(providerId).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Search products by name keyword (case-insensitive partial match)")
    public List<CatalogResponseDto> searchOffersByName(
            @McpToolParam(description = "Name keyword. Example: 'pizza', 'lait', 'para'") String name) {
        return catalogRepository.findByNameContainingIgnoreCase(name).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get only currently available products (available=true)")
    public List<CatalogResponseDto> getAvailableOffers() {
        return catalogRepository.findByAvailableTrue().stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Filter food items by category. Values: PIZZA,BURGER,SANDWICH,TACOS,ITALIAN,ASIAN,MOROCCAN,MEXICAN,FAST_FOOD,SNACKS,PROMOTION,TOP_SELLER")
    public List<CatalogResponseDto> getOffersByFoodCategory(
            @McpToolParam(description = "FoodCategory: PIZZA|BURGER|SANDWICH|TACOS|ITALIAN|ASIAN|MOROCCAN|MEXICAN|FAST_FOOD|SNACKS|PROMOTION|TOP_SELLER") FoodCategory category) {
        return catalogRepository.findByFoodCategoriesContaining(category).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Filter pharmacy products by category. Values: MEDICINE,AESTHETIC,MEDICAL_EQUIPMENT,SUPPLEMENTS,BABY_CARE,HYGIENE,VISION,PROMOTION,OTHER")
    public List<CatalogResponseDto> getOffersByPharmacyCategory(
            @McpToolParam(description = "PharmacyCategory: MEDICINE|AESTHETIC|MEDICAL_EQUIPMENT|SUPPLEMENTS|BABY_CARE|HYGIENE|VISION|PROMOTION|OTHER") PharmacyCategory category) {
        return catalogRepository.findByPharmacyCategoriesContaining(category).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Filter supermarket products by category. Values: BEVERAGES,DAIRY,BAKERY,MEAT,VEGETABLES,FRUITS,SNACKS,CLEANING,PERSONAL_CARE,PROMOTION,TOP_SELLER")
    public List<CatalogResponseDto> getOffersBySupermarketCategory(
            @McpToolParam(description = "SupermarketCategory: BEVERAGES|DAIRY|BAKERY|MEAT|VEGETABLES|FRUITS|SNACKS|CLEANING|PERSONAL_CARE|PROMOTION|TOP_SELLER") SupermarketCategory category) {
        return catalogRepository.findBySupermarketCategoriesContaining(category).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Filter food items by category for a SPECIFIC restaurant store")
    public List<CatalogResponseDto> getStoreOffersByFoodCategory(
            @McpToolParam(description = "Store MongoDB ObjectId") String storeId,
            @McpToolParam(description = "FoodCategory: PIZZA|BURGER|SANDWICH|TACOS|ITALIAN|ASIAN|MOROCCAN|MEXICAN|FAST_FOOD|SNACKS|PROMOTION|TOP_SELLER") FoodCategory category) {
        return catalogRepository.findByStoreIdAndFoodCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto).toList();
    }

    @Override
    @McpTool(description = "Filter pharmacy products by category for a SPECIFIC pharmacy store")
    public List<CatalogResponseDto> getStoreOffersByPharmacyCategory(
            @McpToolParam(description = "Store MongoDB ObjectId") String storeId,
            @McpToolParam(description = "PharmacyCategory: MEDICINE|AESTHETIC|MEDICAL_EQUIPMENT|SUPPLEMENTS|BABY_CARE|HYGIENE|VISION|PROMOTION|OTHER") PharmacyCategory category) {
        return catalogRepository.findByStoreIdAndPharmacyCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto).toList();
    }

    @Override
    @McpTool(description = "Filter supermarket products by category for a SPECIFIC supermarket store")
    public List<CatalogResponseDto> getStoreOffersBySupermarketCategory(
            @McpToolParam(description = "Store MongoDB ObjectId") String storeId,
            @McpToolParam(description = "SupermarketCategory: BEVERAGES|DAIRY|BAKERY|MEAT|VEGETABLES|FRUITS|SNACKS|CLEANING|PERSONAL_CARE|PROMOTION|TOP_SELLER") SupermarketCategory category) {
        return catalogRepository.findByStoreIdAndSupermarketCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto).toList();
    }

    @Override
    @McpTool(description = "Get products by main type. Values: RESTAURANT, PHARMACY, SUPERMARKET, SPECIAL_DELIVERY")
    public List<CatalogResponseDto> getProductsByMainType(
            @McpToolParam(description = "RESTAURANT | PHARMACY | SUPERMARKET | SPECIAL_DELIVERY") String mainType) {
        String alias = switch (mainType.toUpperCase()) {
            case "PHARMACY"         -> "pharmacy_item";
            case "RESTAURANT"       -> "restaurant_item";
            case "SUPERMARKET"      -> "SUPERMARKET";
            case "SPECIAL_DELIVERY" -> "delivery_service";
            default -> throw new IllegalArgumentException("Type inconnu : " + mainType);
        };
        return catalogRepository.findByItemType(alias).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Calculate delivery cost. Formula: basePrice + (distanceKm×pricePerKm) + (weightKg×pricePerKg)")
    public double calculateDeliveryPrice(
            @McpToolParam(description = "MongoDB ObjectId of the SpecialDelivery service") String deliveryId,
            @McpToolParam(description = "Distance in km") Double distanceKm,
            @McpToolParam(description = "Package weight in kg") Double weightKg) {
        Catalog offer = catalogRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery service not found: " + deliveryId));
        if (!(offer instanceof SpecialDelivery))
            throw new RuntimeException("Not a delivery service: " + offer.getClass().getSimpleName());
        return ((SpecialDelivery) offer).calculatePrice(distanceKm, weightKg);
    }
}
