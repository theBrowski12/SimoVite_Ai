package cf.catalog_service.srevices;

import cf.catalog_service.dto.store.StoreRequestDto;
import cf.catalog_service.dto.store.StoreResponseDto;
import cf.catalog_service.entities.Address;
import cf.catalog_service.entities.Store;
import cf.catalog_service.mapper.StoreMapper;
import cf.catalog_service.repository.StoreRepository;
import cf.catalog_service.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final StoreMapper storeMapper;

    @Override
    @Tool(description = "[ADMIN ONLY] Create a new store. category must be: RESTAURANT, PHARMACY, SUPERMARKET, or SPECIAL_DELIVERY")
    public StoreResponseDto createStore(
            @ToolParam(description = "Store details. Required: name, description, category, address, phone. ownerId is auto-set from JWT.") StoreRequestDto requestDto) {
        log.info("Création d'un nouveau magasin : {}", requestDto.getName());
        String ownerId = JwtUtils.getUserId();
        Store store = Store.builder()
                .name(requestDto.getName())
                .description(requestDto.getDescription())
                .category(requestDto.getCategory())
                .phone(requestDto.getPhone())
                .imageURL(requestDto.getImageURL())
                .open(requestDto.getOpen() != null ? requestDto.getOpen() : true)
                .ownerId(ownerId)
                .address(Address.builder()
                        .city(requestDto.getAddress().getCity())
                        .street(requestDto.getAddress().getStreet())
                        .buildingNumber(requestDto.getAddress().getBuildingNumber())
                        .apartment(requestDto.getAddress().getApartment())
                        .latitude(requestDto.getAddress().getLatitude())
                        .longitude(requestDto.getAddress().getLongitude())
                        .build())
                .build();
        return storeMapper.toDto(storeRepository.save(store));
    }

    @Override
    @Tool(description = "Get a store's full details by its MongoDB ObjectId")
    public StoreResponseDto getStoreById(
            @ToolParam(description = "MongoDB ObjectId of the store (24 hex chars)") String id) {
        return storeMapper.toDto(storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Magasin introuvable : " + id)));
    }

    @Override
    @Tool(description = "Get all stores across all categories. Prefer filtered tools when possible.")
    public List<StoreResponseDto> getAllStores() {
        return storeRepository.findAll().stream()
                .map(storeMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "[ADMIN / STORE_OWNER ONLY] Update an existing store's information by ID")
    public StoreResponseDto updateStore(
            @ToolParam(description = "MongoDB ObjectId of the store to update") String id,
            @ToolParam(description = "Updated store details") StoreRequestDto requestDto) {
        log.info("Mise à jour du magasin : {}", id);
        Store existing = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Magasin introuvable : " + id));
        Store updated = storeMapper.toEntity(requestDto);
        updated.setId(existing.getId());
        return storeMapper.toDto(storeRepository.save(updated));
    }

    @Override
    @Tool(description = "Search stores by name keyword (case-insensitive partial match). Use when user mentions a store by name.")
    public List<StoreResponseDto> getStoreByName(
            @ToolParam(description = "Partial or full store name. Example: 'Pizza', 'Pharmacie Centrale'") String name) {
        return storeRepository.findByNameContainingIgnoreCase(name).stream()
                .map(storeMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "[ADMIN ONLY] Permanently delete a store by ID. IRREVERSIBLE — confirm before calling.")
    public void deleteStore(
            @ToolParam(description = "MongoDB ObjectId of the store to delete") String id) {
        log.info("Suppression du magasin : {}", id);
        if (!storeRepository.existsById(id))
            throw new RuntimeException("Magasin introuvable : " + id);
        storeRepository.deleteById(id);
    }

    @Override
    @Tool(description = "Get all stores owned by a specific user. Use with the owner's Keycloak UUID.")
    public List<StoreResponseDto> getStoresByOwner(
            @ToolParam(description = "Keycloak UUID of the store owner") String ownerId) {
        return storeRepository.findByOwnerId(ownerId).stream()
                .map(storeMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Filter stores by category. Values: RESTAURANT, PHARMACY, SUPERMARKET, SPECIAL_DELIVERY")
    public List<StoreResponseDto> getStoresByCategory(
            @ToolParam(description = "Category: RESTAURANT | PHARMACY | SUPERMARKET | SPECIAL_DELIVERY") String category) {
        return storeRepository.findByCategory(category).stream()
                .map(storeMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Tool(description = "Get all currently open stores. Use when user asks 'what is open now?' or 'available stores'.")
    public List<StoreResponseDto> getOpenStores() {
        return storeRepository.findByOpenTrue().stream()
                .map(storeMapper::toDto).collect(Collectors.toList());
    }
}
