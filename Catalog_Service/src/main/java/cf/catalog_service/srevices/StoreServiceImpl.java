package cf.catalog_service.srevices;

import cf.catalog_service.dto.store.StoreRequestDto;
import cf.catalog_service.dto.store.StoreResponseDto;
import cf.catalog_service.entities.Store;
import cf.catalog_service.mapper.StoreMapper;
import cf.catalog_service.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springaicommunity.mcp.annotation.McpTool;
import org.springaicommunity.mcp.annotation.McpToolParam;
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
    @McpTool(description = "Create a new store")
    public StoreResponseDto createStore(
            @McpToolParam(description = "Store details to create") StoreRequestDto requestDto) {
        log.info("Création d'un nouveau magasin : {}", requestDto.getName());

        Store store = storeMapper.toEntity(requestDto);
        Store savedStore = storeRepository.save(store);

        return storeMapper.toDto(savedStore);
    }

    @Override
    @McpTool(description = "Get a store by its unique ID")
    public StoreResponseDto getStoreById(
            @McpToolParam(description = "The unique ID of the store") String id) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Magasin introuvable avec l'ID : " + id));
        return storeMapper.toDto(store);
    }

    @Override
    @McpTool(description = "Get a list of all stores")
    public List<StoreResponseDto> getAllStores() {
        return storeRepository.findAll()
                .stream()
                .map(storeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Update an existing store's information")
    public StoreResponseDto updateStore(
            @McpToolParam(description = "ID of the store to update") String id,
            @McpToolParam(description = "Updated store details") StoreRequestDto requestDto) {
        log.info("Mise à jour du magasin avec l'ID : {}", id);

        // 1. On vérifie que le magasin existe
        Store existingStore = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Magasin introuvable avec l'ID : " + id));

        // 2. On transforme la requête en entité pour récupérer les nouvelles valeurs
        Store updatedData = storeMapper.toEntity(requestDto);

        // 3. On met à jour l'ID pour ne pas créer un nouveau document dans MongoDB
        updatedData.setId(existingStore.getId());

        // 4. On sauvegarde (MongoDB écrase le document existant avec le même ID)
        Store savedStore = storeRepository.save(updatedData);

        return storeMapper.toDto(savedStore);
    }

    @Override
    @McpTool(description = "Search for stores by their name")
    public List<StoreResponseDto> getStoreByName(
            @McpToolParam(description = "Name or partial name of the store") String name) {
        return storeRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(storeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Delete a store by its ID")
    public void deleteStore(
            @McpToolParam(description = "ID of the store to delete") String id) {
        log.info("Suppression du magasin avec l'ID : {}", id);
        if (!storeRepository.existsById(id)) {
            throw new RuntimeException("Impossible de supprimer : Magasin introuvable avec l'ID : " + id);
        }
        // TODO plus tard : Vérifier s'il y a des articles (Catalog) liés à ce magasin avant de le supprimer,
        // ou supprimer les articles en cascade !
        storeRepository.deleteById(id);
    }

    @Override
    @McpTool(description = "Get all stores owned by a specific user/owner")
    public List<StoreResponseDto> getStoresByOwner(
            @McpToolParam(description = "ID of the store owner") String ownerId) {
        return storeRepository.findByOwnerId(ownerId)
                .stream()
                .map(storeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get stores filtered by their category (e.g., PHARMACY, RESTAURANT, SUPERMARKET)")
    public List<StoreResponseDto> getStoresByCategory(
            @McpToolParam(description = "Category to filter by") String category) {
        return storeRepository.findByCategory(category)
                .stream()
                .map(storeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @McpTool(description = "Get a list of all currently open stores")
    public List<StoreResponseDto> getOpenStores() {
        return storeRepository.findByIsOpenTrue()
                .stream()
                .map(storeMapper::toDto)
                .collect(Collectors.toList());
    }
}
