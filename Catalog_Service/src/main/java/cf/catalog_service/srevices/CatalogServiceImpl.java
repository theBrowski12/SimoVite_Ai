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
    @McpTool(description = "USE THIS TOOL ONLY FOR RESTAURANTS. Adds food, meals, drinks, or restaurant items (like Burrito, Pizza, Burger). NEVER use this for medicine or groceries.")
    public CatalogResponseDto createRestaurantItem(
            @McpToolParam(description = "Restaurant item details") RestaurantRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @McpTool(description = "USE THIS TOOL ONLY FOR PHARMACIES. Adds medicine, drugs, or health products. NEVER use this for food.")
    public CatalogResponseDto createPharmacyItem(
            @McpToolParam(description = "Pharmacy item details") PharmacyRequestDto requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @McpTool(description = "Add a new grocery item to a SUPERMARKET")
    public CatalogResponseDto createSupermarketItem(
            @McpToolParam(description = "Supermarket item details") SupermarketRequestDTO requestDto) {
        return this.createOffer(requestDto);
    }

    @Override
    @McpTool(description = "Create a new SPECIAL DELIVERY service configuration")
    public CatalogResponseDto createDeliveryService(
            @McpToolParam(description = "Delivery service details") SpecialDeliveryRequestDto requestDto) {
        return this.createOffer(requestDto);
    }
    @Override
    @McpTool(description = "Get product by ID")
    public CatalogResponseDto getOfferById(@McpToolParam(description = "Product ID") String id) {
        Catalog entity = catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offre introuvable avec l'ID : " + id));
        return catalogMapper.toDto(entity);
    }

    @Override
    @McpTool(description = "Get All products")
    public List<CatalogResponseDto> getAllOffers() {
        return catalogRepository.findAll().stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Update an existing product")
    public CatalogResponseDto updateOffer(
            @McpToolParam(description = "ID of the product to update") String id,
            @McpToolParam(description = "Updated product data") CatalogRequestDto requestDto) {
        catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Impossible de modifier. Offre introuvable (ID: " + id + ")"));

        Catalog updatedEntity = catalogMapper.toEntity(requestDto);
        updatedEntity.setId(id);
        return catalogMapper.toDto(catalogRepository.save(updatedEntity));
    }
    @Override
    @McpTool(description = "Delete a product")
    public void deleteOffer(@McpToolParam(description = "Product ID to delete") String id) {
        if (!catalogRepository.existsById(id)) {
            throw new RuntimeException("Impossible de supprimer. Offre introuvable (ID: " + id + ")");
        }
        catalogRepository.deleteById(id);
    }

    // ==========================================
    // MÉTHODES DE RECHERCHE AVANCÉE
    // ==========================================

    @Override
    @McpTool(description = "Get products by store ID")
    public List<CatalogResponseDto> getOffersByProviderId(@McpToolParam(description = "Store ID") String providerId) {
        return catalogRepository.findByStoreId(providerId).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get products by name")
    public List<CatalogResponseDto> searchOffersByName(@McpToolParam(description = "Product name") String name) {
        return catalogRepository.findByNameContainingIgnoreCase(name).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get all available products")
    public List<CatalogResponseDto> getAvailableOffers() {
        return catalogRepository.findByIsAvailableTrue().stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    // ==========================================
    // FILTRES GLOBAUX PAR CATÉGORIE
    // ==========================================

    @Override
    @McpTool(description = "Get products by Food category")
    public List<CatalogResponseDto> getOffersByFoodCategory(@McpToolParam(description = "Food Category") FoodCategory category) {
        return catalogRepository.findByFoodCategoriesContaining(category).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get products by Pharmacy category")
    public List<CatalogResponseDto> getOffersByPharmacyCategory(@McpToolParam(description = "Pharmacy Category") PharmacyCategory category) {
        return catalogRepository.findByPharmacyCategoriesContaining(category).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get products by Supermarket category")
    public List<CatalogResponseDto> getOffersBySupermarketCategory(@McpToolParam(description = "Supermarket Category") SupermarketCategory category) {
        return catalogRepository.findBySupermarketCategoriesContaining(category).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    // ==========================================
    // FILTRES PAR CATÉGORIE POUR UN MAGASIN SPÉCIFIQUE
    // ==========================================

    @Override
    @McpTool(description = "Get food products for a specific store by category")
    public List<CatalogResponseDto> getStoreOffersByFoodCategory(
            @McpToolParam(description = "ID of the store") String storeId,
            @McpToolParam(description = "Food Category") FoodCategory category) {
        return catalogRepository.findByStoreIdAndFoodCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto)
                .toList();
    }

    @Override
    @McpTool(description = "Get pharmacy products for a specific store by category")
    public List<CatalogResponseDto> getStoreOffersByPharmacyCategory(
            @McpToolParam(description = "ID of the store") String storeId,
            @McpToolParam(description = "Pharmacy Category") PharmacyCategory category) {
        return catalogRepository.findByStoreIdAndPharmacyCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto)
                .toList();
    }

    @Override
    @McpTool(description = "Get supermarket products for a specific store by category")
    public List<CatalogResponseDto> getStoreOffersBySupermarketCategory(
            @McpToolParam(description = "ID of the store") String storeId,
            @McpToolParam(description = "Supermarket Category") SupermarketCategory category) {
        return catalogRepository.findByStoreIdAndSupermarketCategoriesContaining(storeId, category).stream()
                .map(catalogMapper::toDto)
                .toList();
    }

    @Override
    @McpTool(description = "Get all products by their main type (e.g., PHARMACY, RESTAURANT)")
    public List<CatalogResponseDto> getProductsByMainType(@McpToolParam(description = "Main type") String mainType) {

        // On traduit le type demandé en alias MongoDB
        String alias = switch (mainType.toUpperCase()) {
            case "PHARMACY" -> "pharmacy_item";
            case "RESTAURANT" -> "restaurant_item";
            case "SUPERMARKET" -> "SUPERMARKET";
            case "DELIVERY" -> "delivery_service";
            default -> throw new IllegalArgumentException("Type de produit inconnu : " + mainType);
        };

        // On interroge la base de données
        return catalogRepository.findByItemType(alias).stream()
                .map(catalogMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Calculate the total cost of a delivery based on distance (km) and weight (kg)")
    public double calculateDeliveryPrice(
            @McpToolParam(description = "The ID of the delivery service catalog item") String deliveryId,
            @McpToolParam(description = "The distance of the delivery in kilometers") double distanceKm,
            @McpToolParam(description = "The weight of the package in kilograms") double weightKg) {

        // 1. On cherche l'offre dans la base de données
        Catalog offer = catalogRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery service not found with ID: " + deliveryId));

        // 2. On vérifie que c'est bien une offre de type livraison
        if (!(offer instanceof SpecialDelivery)) {
            throw new RuntimeException("The requested ID is not a delivery service. It is a: " + offer.getClass().getSimpleName());
        }

        // 3. On fait le calcul (en utilisant la méthode que tu as déjà codée dans ton Entité !)
        SpecialDelivery deliveryService = (SpecialDelivery) offer;

        return deliveryService.calculatePrice(distanceKm, weightKg);
    }
}
