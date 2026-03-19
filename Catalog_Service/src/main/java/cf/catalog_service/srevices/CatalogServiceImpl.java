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
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
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
        Catalog savedEntity = catalogRepository.save(entityToSave);
        return catalogMapper.toDto(savedEntity);
    }
    @Override
    @Tool(description = """
            [ADMIN / STORE_OWNER ONLY] Add a new FOOD item to a RESTAURANT store.
            Use ONLY for food, meals, drinks, or anything edible served by a restaurant.
            NEVER use for medicine, groceries, or delivery services.
            
            Required fields: name, description, basePrice, storeId, ingredients, foodCategories.
            
            foodCategories — pick one or more EXACT values from this list:
              🍕 PIZZA        → Pizza, calzone, flatbreads
              🍔 BURGER       → Beef, chicken, veggie burgers
              🥪 SANDWICH     → Club, panini, wraps, baguettes
              🌮 TACOS        → Tacos, quesadillas, nachos
              🍝 ITALIAN      → Pasta, risotto, lasagna
              🍜 ASIAN        → Sushi, ramen, noodles, dim sum, wok
              🥘 MOROCCAN     → Tagine, couscous, harira, pastilla
              🌯 MEXICAN      → Burritos, enchiladas, guacamole
              🍟 FAST_FOOD    → Fries, nuggets, hot dogs, combos
              🧆 SNACKS       → Small bites, appetizers, sides
              🎉 PROMOTION    → Discounted or promotional items
              ⭐ TOP_SELLER   → Best selling items of the restaurant
            
            Optional: isVegetarian (true/false), allergens (comma-separated text), availableExtras.
            """)
    public CatalogResponseDto createRestaurantItem(
            @ToolParam(description = """
                    Full restaurant item object. foodCategories must be a list of values from:
                    [PIZZA, BURGER, SANDWICH, TACOS, ITALIAN, ASIAN, MOROCCAN, MEXICAN, FAST_FOOD, SNACKS, PROMOTION, TOP_SELLER]
                    Example: { "name": "Pizza Margherita", "basePrice": 45.0, "storeId": "abc123",
                    "foodCategories": ["PIZZA", "TOP_SELLER"], "ingredients": ["tomato", "mozzarella"],
                    "isVegetarian": true, "allergens": "Gluten, Lait" }
                    """) RestaurantRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @Tool(description = "Add a MEDICINE or health product to a pharmacy. pharmacyCategories: MEDICINE,AESTHETIC,MEDICAL_EQUIPMENT,SUPPLEMENTS,BABY_CARE,HYGIENE,VISION,PROMOTION,OTHER")
    public CatalogResponseDto createPharmacyItem(
            @ToolParam(description = "Pharmacy item. Required: name,basePrice,storeId,activeIngredient,pharmacyCategories. Optional: dosage,requiresPrescription") PharmacyRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @Tool(description = "Add a GROCERY item to a supermarket. supermarketCategories: BEVERAGES,DAIRY,BAKERY,MEAT,VEGETABLES,FRUITS,SNACKS,CLEANING,PERSONAL_CARE,PROMOTION,TOP_SELLER")
    public CatalogResponseDto createSupermarketItem(
            @ToolParam(description = "Supermarket item. Required: name,basePrice,storeId,weightInKg,supermarketCategories") SupermarketRequestDTO requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @Tool(description = "Create a SPECIAL DELIVERY service config (NOT a product). Pricing: basePrice + distanceKm×pricePerKm + weightKg×pricePerKg")
    public CatalogResponseDto createDeliveryService(
            @ToolParam(description = "Delivery service. Required: name,basePrice,storeId,pricePerKm,pricePerKg,maxWeightKg") SpecialDeliveryRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @Tool(description = "Get product details by MongoDB ID")
    public CatalogResponseDto getOfferById(
            @ToolParam(description = "MongoDB ObjectId (24 hex chars)") String id) {
        return catalogMapper.toDto(catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable : " + id)));
    }

    @Override
    @Tool(description = "Get ALL products across all stores. Prefer filtered tools when possible.")
    public List<CatalogResponseDto> getAllOffers() {
        return catalogRepository.findAll().stream().map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Update an existing product by ID")
    public CatalogResponseDto updateOffer(
            @ToolParam(description = "MongoDB ObjectId of product to update") String id,
            @ToolParam(description = "Updated product data") CatalogRequestDto requestDto) {
        catalogRepository.findById(id).orElseThrow(() -> new RuntimeException("Produit introuvable : " + id));
        Catalog updated = catalogMapper.toEntity(requestDto);
        updated.setId(id);
        return catalogMapper.toDto(catalogRepository.save(updated));
    }

    @Override
    @Tool(description = "Permanently DELETE a product. IRREVERSIBLE — confirm before calling.")
    public void deleteOffer(
            @ToolParam(description = "MongoDB ObjectId of product to delete") String id) {
        if (!catalogRepository.existsById(id)) throw new RuntimeException("Produit introuvable : " + id);
        catalogRepository.deleteById(id);
    }

    @Override
    @Tool(description = "Toggle product availability. Verifies ownership for STORE_OWNER. ADMIN bypasses check.")
    public CatalogResponseDto toggleAvailability(
            @ToolParam(description = "MongoDB ObjectId of product") String productId,
            @ToolParam(description = "Keycloak UUID of requesting user (JWT sub)") String requestingOwnerId) {

        Catalog catalog = catalogRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produit introuvable : " + productId));

        // ✅ ADMIN bypass — pas de vérification d'ownership
        boolean isAdmin = SecurityContextHolder.getContext()
                .getAuthentication()
                .getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Store store = storeRepository.findById(catalog.getStoreId())
                    .orElseThrow(() -> new RuntimeException("Store introuvable"));
            if (!store.getOwnerId().equals(requestingOwnerId)) {
                throw new RuntimeException("❌ Accès refusé !");
            }
        }

        catalog.setAvailable(!catalog.isAvailable());
        return catalogMapper.toDto(catalogRepository.save(catalog));
    }

    // ==========================================
    // MÉTHODES DE RECHERCHE AVANCÉE
    // ==========================================

    @Override
    @Tool(description = "Get all products of a specific store by storeId")
    public List<CatalogResponseDto> getOffersByProviderId(
            @ToolParam(description = "MongoDB ObjectId of the store") String providerId) {
        return catalogRepository.findByStoreId(providerId).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Search products by name keyword (case-insensitive partial match)")
    public List<CatalogResponseDto> searchOffersByName(
            @ToolParam(description = "Name keyword. Example: 'pizza', 'lait', 'para'") String name) {
        return catalogRepository.findByNameContainingIgnoreCase(name).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Get only currently available products (available=true)")
    public List<CatalogResponseDto> getAvailableOffers() {
        return catalogRepository.findByAvailableTrue().stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    // ==========================================
    // FILTRES GLOBAUX PAR CATÉGORIE
    // ==========================================

    @Override
    @Tool(description = "Filter food items by category. Values: PIZZA,BURGER,SANDWICH,TACOS,ITALIAN,ASIAN,MOROCCAN,MEXICAN,FAST_FOOD,SNACKS,PROMOTION,TOP_SELLER")
    public List<CatalogResponseDto> getOffersByFoodCategory(
            @ToolParam(description = "FoodCategory: PIZZA|BURGER|SANDWICH|TACOS|ITALIAN|ASIAN|MOROCCAN|MEXICAN|FAST_FOOD|SNACKS|PROMOTION|TOP_SELLER") FoodCategory category) {
        return catalogRepository.findByFoodCategoriesContaining(category).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Filter pharmacy products by category. Values: MEDICINE,AESTHETIC,MEDICAL_EQUIPMENT,SUPPLEMENTS,BABY_CARE,HYGIENE,VISION,PROMOTION,OTHER")
    public List<CatalogResponseDto> getOffersByPharmacyCategory(
            @ToolParam(description = "PharmacyCategory: MEDICINE|AESTHETIC|MEDICAL_EQUIPMENT|SUPPLEMENTS|BABY_CARE|HYGIENE|VISION|PROMOTION|OTHER") PharmacyCategory category) {
        return catalogRepository.findByPharmacyCategoriesContaining(category).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Filter supermarket products by category. Values: BEVERAGES,DAIRY,BAKERY,MEAT,VEGETABLES,FRUITS,SNACKS,CLEANING,PERSONAL_CARE,PROMOTION,TOP_SELLER")
    public List<CatalogResponseDto> getOffersBySupermarketCategory(
            @ToolParam(description = "SupermarketCategory: BEVERAGES|DAIRY|BAKERY|MEAT|VEGETABLES|FRUITS|SNACKS|CLEANING|PERSONAL_CARE|PROMOTION|TOP_SELLER") SupermarketCategory category) {
        return catalogRepository.findBySupermarketCategoriesContaining(category).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    // ==========================================
    // FILTRES PAR CATÉGORIE POUR UN MAGASIN SPÉCIFIQUE
    // ==========================================

    @Override
    @Tool(description = "Filter food items by category for a SPECIFIC restaurant store")
    public List<CatalogResponseDto> getStoreOffersByFoodCategory(
            @ToolParam(description = "Store MongoDB ObjectId") String storeId,
            @ToolParam(description = "FoodCategory: PIZZA|BURGER|SANDWICH|TACOS|ITALIAN|ASIAN|MOROCCAN|MEXICAN|FAST_FOOD|SNACKS|PROMOTION|TOP_SELLER") FoodCategory category) {
        return catalogRepository.findByStoreIdAndFoodCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto).toList();
    }

    @Override
    @Tool(description = "Filter pharmacy products by category for a SPECIFIC pharmacy store")
    public List<CatalogResponseDto> getStoreOffersByPharmacyCategory(
            @ToolParam(description = "Store MongoDB ObjectId") String storeId,
            @ToolParam(description = "PharmacyCategory: MEDICINE|AESTHETIC|MEDICAL_EQUIPMENT|SUPPLEMENTS|BABY_CARE|HYGIENE|VISION|PROMOTION|OTHER") PharmacyCategory category) {
        return catalogRepository.findByStoreIdAndPharmacyCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto).toList();
    }

    @Override
    @Tool(description = "Filter supermarket products by category for a SPECIFIC supermarket store")
    public List<CatalogResponseDto> getStoreOffersBySupermarketCategory(
            @ToolParam(description = "Store MongoDB ObjectId") String storeId,
            @ToolParam(description = "SupermarketCategory: BEVERAGES|DAIRY|BAKERY|MEAT|VEGETABLES|FRUITS|SNACKS|CLEANING|PERSONAL_CARE|PROMOTION|TOP_SELLER") SupermarketCategory category) {
        return catalogRepository.findByStoreIdAndSupermarketCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto).toList();
    }

    @Override
    @Tool(description = "Get products by main type. Values: RESTAURANT, PHARMACY, SUPERMARKET, SPECIAL_DELIVERY")
    public List<CatalogResponseDto> getProductsByMainType(
            @ToolParam(description = "RESTAURANT | PHARMACY | SUPERMARKET | SPECIAL_DELIVERY") String mainType) {
        String alias = switch (mainType.toUpperCase()) {
            case "PHARMACY" -> "pharmacy_item";
            case "RESTAURANT" -> "restaurant_item";
            case "SUPERMARKET" -> "SUPERMARKET";
            case "SPECIAL_DELIVERY" -> "delivery_service";
            default -> throw new IllegalArgumentException("Type inconnu : " + mainType);
        };
        return catalogRepository.findByItemType(alias).stream()
                .map(catalogMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Calculate delivery cost. Formula: basePrice + (distanceKm×pricePerKm) + (weightKg×pricePerKg)")
    public double calculateDeliveryPrice(
            @ToolParam(description = "MongoDB ObjectId of the SpecialDelivery service") String deliveryId,
            @ToolParam(description = "Distance in km") double distanceKm,
            @ToolParam(description = "Package weight in kg") double weightKg) {
        Catalog offer = catalogRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery service not found: " + deliveryId));
        if (!(offer instanceof SpecialDelivery))
            throw new RuntimeException("Not a delivery service: " + offer.getClass().getSimpleName());
        return ((SpecialDelivery) offer).calculatePrice(distanceKm, weightKg);
    }
}
