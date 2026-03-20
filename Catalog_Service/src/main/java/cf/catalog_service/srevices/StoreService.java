package cf.catalog_service.srevices;

import cf.catalog_service.dto.store.StoreRequestDto;
import cf.catalog_service.dto.store.StoreResponseDto;
import cf.catalog_service.enums.MainCategory;

import java.util.List;
import java.util.Optional;

public interface StoreService {
    StoreResponseDto createStore(StoreRequestDto requestDto);
    StoreResponseDto getStoreById(String id);
    List<StoreResponseDto> getAllStores();
    StoreResponseDto updateStore(String id, StoreRequestDto requestDto);
    List<StoreResponseDto> getStoreByName(String name);
    void deleteStore(String id);

    // Recherches spécifiques
    List<StoreResponseDto> getStoresByOwner(String ownerId);
    List<StoreResponseDto> getStoresByCategory(MainCategory category);
    List<StoreResponseDto> getOpenStores();
}
