package cf.catalog_service.api;

import cf.catalog_service.dto.store.StoreRequestDto;
import cf.catalog_service.dto.store.StoreResponseDto;
import cf.catalog_service.srevices.StoreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/stores")
@RequiredArgsConstructor
@Tag(name = "Store Management", description = "API de gestion des points de vente (Restaurants, Pharmacies, etc.)")
public class StoreController {

    private final StoreService storeService;

    // ==========================================
    // 1. CRUD BASIQUE
    // ==========================================

    @PostMapping
    @Operation(summary = "Créer un nouveau magasin")
    public ResponseEntity<StoreResponseDto> createStore(@RequestBody StoreRequestDto requestDto) {
        return new ResponseEntity<>(storeService.createStore(requestDto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un magasin par son ID")
    public ResponseEntity<StoreResponseDto> getStoreById(@PathVariable String id) {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }

    @GetMapping
    @Operation(summary = "Lister tous les magasins")
    public ResponseEntity<List<StoreResponseDto>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un magasin existant")
    public ResponseEntity<StoreResponseDto> updateStore(
            @PathVariable String id,
            @RequestBody StoreRequestDto requestDto) {
        return ResponseEntity.ok(storeService.updateStore(id, requestDto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un magasin")
    public ResponseEntity<Void> deleteStore(@PathVariable String id) {
        storeService.deleteStore(id);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // 2. RECHERCHES SPÉCIFIQUES
    // ==========================================

    @GetMapping("/search")
    @Operation(summary = "Rechercher des magasins par nom (partiel, ignore les majuscules)")
    public ResponseEntity<List<StoreResponseDto>> getStoreByName(@RequestParam String name) {
        // Retourne bien une liste de magasins comme convenu !
        return ResponseEntity.ok(storeService.getStoreByName(name));
    }

    @GetMapping("/owner/{ownerId}")
    @Operation(summary = "Lister les magasins d'un propriétaire spécifique")
    public ResponseEntity<List<StoreResponseDto>> getStoresByOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(storeService.getStoresByOwner(ownerId));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Filtrer les magasins par catégorie (ex: RESTAURANT, PHARMACY)")
    public ResponseEntity<List<StoreResponseDto>> getStoresByCategory(@PathVariable String category) {
        return ResponseEntity.ok(storeService.getStoresByCategory(category));
    }

    @GetMapping("/open")
    @Operation(summary = "Lister uniquement les magasins actuellement ouverts")
    public ResponseEntity<List<StoreResponseDto>> getOpenStores() {
        return ResponseEntity.ok(storeService.getOpenStores());
    }
}
