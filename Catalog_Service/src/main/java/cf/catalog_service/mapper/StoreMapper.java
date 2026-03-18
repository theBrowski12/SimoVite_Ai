package cf.catalog_service.mapper;

import cf.catalog_service.dto.AddressDto;
import cf.catalog_service.dto.store.StoreRequestDto;
import cf.catalog_service.dto.store.StoreResponseDto;
import cf.catalog_service.entities.Address;
import cf.catalog_service.entities.Store;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

@Component
public class StoreMapper {

    // 1. Convertir la requête (DTO) vers l'Entité (MongoDB)
    public Store toEntity(StoreRequestDto dto) {
        if (dto == null) {
            return null;
        }

        Store entity = new Store();

        // Copie les propriétés simples (name, description, category, ownerId, isOpen)
        BeanUtils.copyProperties(dto, entity);

        // ⚠️ Gestion manuelle de l'adresse (car AddressDto != Address)
        if (dto.getAddress() != null) {
            Address address = new Address();
            BeanUtils.copyProperties(dto.getAddress(), address);
            entity.setAddress(address);
        }

        return entity;
    }

    // 2. Convertir l'Entité (MongoDB) vers la réponse (DTO)
    public StoreResponseDto toDto(Store entity) {
        if (entity == null) {
            return null;
        }

        StoreResponseDto dto = new StoreResponseDto();

        // Copie les propriétés simples
        BeanUtils.copyProperties(entity, dto);

        // ⚠️ Gestion manuelle de l'adresse
        if (entity.getAddress() != null) {
            dto.setAddress(toAddressDto(entity.getAddress()));
        }

        return dto;
    }

    // 3. Méthode utilitaire pour l'adresse (tu peux aussi la réutiliser si besoin)
    private AddressDto toAddressDto(Address address) {
        if (address == null) {
            return null;
        }
        AddressDto dto = new AddressDto();
        BeanUtils.copyProperties(address, dto);
        return dto;
    }
}
