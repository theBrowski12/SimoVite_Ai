package cf.catalog_service.api;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import cf.catalog_service.dto.pharmacy.PharmacyRequestDto;
import cf.catalog_service.dto.resto.RestaurantRequestDto;
import cf.catalog_service.dto.special.SpecialDeliveryRequestDto;
import cf.catalog_service.dto.supermarket.SupermarketRequestDTO;
import cf.catalog_service.enums.FoodCategory;
import cf.catalog_service.enums.PharmacyCategory;
import cf.catalog_service.enums.SupermarketCategory;
import cf.catalog_service.srevices.CatalogService;
import cf.catalog_service.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/catalog")
@Tag(name = "Catalog API", description = "Gestion des produits (Restaurants, Pharmacies, Supermarchés, Livraisons)")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    // ==========================================
    // CRUD DE BASE
    // ==========================================

    @PostMapping
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Créer un nouveau produit ou service")
    public ResponseEntity<CatalogResponseDto> createOffer(@RequestBody CatalogRequestDto requestDto) {
        return new ResponseEntity<>(catalogService.createOffer(requestDto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Activer/Désactiver la disponibilité d'un produit")
    public ResponseEntity<CatalogResponseDto> toggleAvailability(@PathVariable String id) {
        String ownerId = JwtUtils.getUserId(); // ✅ depuis JWT
        return ResponseEntity.ok(catalogService.toggleAvailability(id, ownerId));
    }

    @PostMapping("/restaurant")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Ajouter un plat ou menu de restaurant")
    public ResponseEntity<CatalogResponseDto> createRestaurantItem(
            @RequestBody RestaurantRequestDto requestDto) { // 🟢 Type strict !

        // Optionnel : Forcer le type en dur si tu utilises toujours un champ type en base
        // requestDto.setType("restaurant_item");
        return new ResponseEntity<>(catalogService.createOffer(requestDto), HttpStatus.CREATED);
    }
    @PostMapping("/pharmacy")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Ajouter un médicament ou produit de santé")
    public ResponseEntity<CatalogResponseDto> createPharmacyItem(
            @RequestBody PharmacyRequestDto requestDto) { // 🟢 Type strict !

        return new ResponseEntity<>(catalogService.createOffer(requestDto), HttpStatus.CREATED);
    }
    @PostMapping("/supermarket")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Ajouter un article de supermarché")
    public ResponseEntity<CatalogResponseDto> createSupermarketItem(
            @RequestBody SupermarketRequestDTO requestDto) { // 🟢 Type strict !

        return new ResponseEntity<>(catalogService.createOffer(requestDto), HttpStatus.CREATED);
    }
    @PostMapping("/delivery")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Créer un service de livraison sur mesure")
    public ResponseEntity<CatalogResponseDto> createDeliveryService(
            @RequestBody SpecialDeliveryRequestDto requestDto) { // 🟢 Type strict !

        return new ResponseEntity<>(catalogService.createOffer(requestDto), HttpStatus.CREATED);
    }
    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un produit par son ID")
    public ResponseEntity<CatalogResponseDto> getOfferById(@PathVariable String id) {
        return ResponseEntity.ok(catalogService.getOfferById(id));
    }

    @GetMapping
    @Operation(summary = "Récupérer absolument tous les produits du catalogue")
    public ResponseEntity<List<CatalogResponseDto>> getAllOffers() {
        return ResponseEntity.ok(catalogService.getAllOffers());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Mettre à jour un produit existant")
    public ResponseEntity<CatalogResponseDto> updateOffer(
            @PathVariable String id,
            @RequestBody CatalogRequestDto requestDto) {
        return ResponseEntity.ok(catalogService.updateOffer(id, requestDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Supprimer un produit")
    public ResponseEntity<Void> deleteOffer(@PathVariable String id) {
        catalogService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // RECHERCHES GLOBALES
    // ==========================================

    @GetMapping("/search")
    @Operation(summary = "Rechercher des produits par nom (Barre de recherche)")
    public ResponseEntity<List<CatalogResponseDto>> searchOffersByName(@RequestParam String name) {
        return ResponseEntity.ok(catalogService.searchOffersByName(name));
    }

    @GetMapping("/available")
    @Operation(summary = "Récupérer uniquement les produits actuellement disponibles")
    public ResponseEntity<List<CatalogResponseDto>> getAvailableOffers() {
        return ResponseEntity.ok(catalogService.getAvailableOffers());
    }

    @GetMapping("/store/{storeId}")
    @Operation(summary = "Récupérer tout le catalogue d'un magasin spécifique (Menu complet)")
    public ResponseEntity<List<CatalogResponseDto>> getOffersByProviderId(@PathVariable String storeId) {
        return ResponseEntity.ok(catalogService.getOffersByProviderId(storeId));
    }

    @GetMapping("/main-type/{mainType}")
    @Operation(summary = "Récupérer tous les produits d'un grand type (ex: RESTAURANT, PHARMACY)")
    public ResponseEntity<List<CatalogResponseDto>> getProductsByMainType(
            @Parameter(description = "Le grand type de produit", example = "PHARMACY")
            @PathVariable String mainType) {
        return ResponseEntity.ok(catalogService.getProductsByMainType(mainType));
    }

    // ==========================================
    // FILTRES GLOBAUX PAR CATÉGORIE (TAGS)
    // ==========================================

    @GetMapping("/food/category/{category}")
    @Operation(summary = "Récupérer les plats de toute l'application par catégorie (ex: PIZZA)")
    public ResponseEntity<List<CatalogResponseDto>> getOffersByFoodCategory(@PathVariable FoodCategory category) {
        return ResponseEntity.ok(catalogService.getOffersByFoodCategory(category));
    }

    @GetMapping("/pharmacy/category/{category}")
    @Operation(summary = "Récupérer les médicaments de toute l'application par catégorie")
    public ResponseEntity<List<CatalogResponseDto>> getOffersByPharmacyCategory(@PathVariable PharmacyCategory category) {
        return ResponseEntity.ok(catalogService.getOffersByPharmacyCategory(category));
    }

    @GetMapping("/supermarket/category/{category}")
    @Operation(summary = "Récupérer les articles de supermarché de toute l'application par catégorie")
    public ResponseEntity<List<CatalogResponseDto>> getOffersBySupermarketCategory(@PathVariable SupermarketCategory category) {
        return ResponseEntity.ok(catalogService.getOffersBySupermarketCategory(category));
    }

    // ==========================================
    // FILTRES PAR CATÉGORIE POUR UN MAGASIN PRÉCIS
    // ==========================================

    @GetMapping("/store/{storeId}/food/category/{category}")
    @Operation(summary = "Récupérer les plats d'un restaurant précis par catégorie")
    public ResponseEntity<List<CatalogResponseDto>> getStoreOffersByFoodCategory(
            @PathVariable String storeId,
            @PathVariable FoodCategory category) {
        return ResponseEntity.ok(catalogService.getStoreOffersByFoodCategory(storeId, category));
    }

    @GetMapping("/store/{storeId}/pharmacy/category/{category}")
    @Operation(summary = "Récupérer les produits d'une pharmacie précise par catégorie")
    public ResponseEntity<List<CatalogResponseDto>> getStoreOffersByPharmacyCategory(
            @PathVariable String storeId,
            @PathVariable PharmacyCategory category) {
        return ResponseEntity.ok(catalogService.getStoreOffersByPharmacyCategory(storeId, category));
    }

    @GetMapping("/store/{storeId}/supermarket/category/{category}")
    @Operation(summary = "Récupérer les produits d'un supermarché précis par catégorie")
    public ResponseEntity<List<CatalogResponseDto>> getStoreOffersBySupermarketCategory(
            @PathVariable String storeId,
            @PathVariable SupermarketCategory category) {
        return ResponseEntity.ok(catalogService.getStoreOffersBySupermarketCategory(storeId, category));
    }

    @GetMapping("/{id}/calculate-price")
    @Operation(summary = "Calculer le devis d'une livraison selon la distance et le poids")
    public ResponseEntity<Double> calculatePrice(
            @PathVariable String id,
            @RequestParam double distanceKm,
            @RequestParam double weightKg) {

        double finalPrice = catalogService.calculateDeliveryPrice(id, distanceKm, weightKg);
        return ResponseEntity.ok(finalPrice);
    }

    // ==========================================
    // GESTION DES PROMOTIONS
    // ==========================================

    @PatchMapping("/{id}/promotion")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Appliquer une promotion en pourcentage sur un produit")
    public ResponseEntity<CatalogResponseDto> applyPromotion(
            @PathVariable String id,
            @RequestParam Double percentage) {

        CatalogResponseDto updatedProduct = catalogService.applyPromotion(id, percentage);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{id}/promotion")
    @PreAuthorize("hasAnyRole('STORE_OWNER', 'ADMIN')")
    @Operation(summary = "Retirer la promotion d'un produit et restaurer son prix de base")
    public ResponseEntity<CatalogResponseDto> removePromotion(
            @PathVariable String id) {

        CatalogResponseDto restoredProduct = catalogService.removePromotion(id);
        return ResponseEntity.ok(restoredProduct);
    }
}
