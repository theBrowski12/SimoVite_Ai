package cf.catalog_service.mapper;

import cf.catalog_service.dto.Catalog.CatalogRequestDto;
import cf.catalog_service.dto.Catalog.CatalogResponseDto;
import cf.catalog_service.dto.pharmacy.PharmacyRequestDto;
import cf.catalog_service.dto.pharmacy.PharmacyResponseDto;
import cf.catalog_service.dto.resto.RestaurantRequestDto;
import cf.catalog_service.dto.resto.RestaurantResponseDto;
import cf.catalog_service.dto.special.SpecialDeliveryRequestDto;
import cf.catalog_service.dto.special.SpecialDeliveryResponseDto;
import cf.catalog_service.dto.supermarket.SupermarketRequestDTO;
import cf.catalog_service.dto.supermarket.SupermarketResponseDTO;
import cf.catalog_service.entities.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CatalogMapper {

    private final StoreMapper storeMapper;

    public Catalog toEntity(CatalogRequestDto dto) {
        if (dto == null) {
            return null;
        }

        Catalog entity;

        // 1. On instancie la bonne sous-classe
        if (dto instanceof RestaurantRequestDto) {
            entity = new Restaurant();
        } else if (dto instanceof PharmacyRequestDto) {
            entity = new Pharmacy();
        } else if (dto instanceof SpecialDeliveryRequestDto) {
            entity = new SpecialDelivery();
        } else if (dto instanceof SupermarketRequestDTO) { // 👈 NOUVEAU
            entity = new SuperMarket();
        } else {
            throw new IllegalArgumentException("Type de DTO non supporté : " + dto.getClass().getSimpleName());
        }

        // 2. On copie les propriétés
        BeanUtils.copyProperties(dto, entity);

        return entity;
    }

    public CatalogResponseDto toDto(Catalog entity) {
        if (entity == null) {
            return null;
        }

        CatalogResponseDto dto;

        // 1. On instancie la bonne sous-classe et on force le type
        if (entity instanceof Restaurant) {
            dto = new RestaurantResponseDto();
            dto.setType("RESTAURANT");
        } else if (entity instanceof Pharmacy) {
            dto = new PharmacyResponseDto();
            dto.setType("PHARMACY");
        } else if (entity instanceof SpecialDelivery) {
            dto = new SpecialDeliveryResponseDto();
            dto.setType("DELIVERY");
        } else if (entity instanceof SuperMarket) { // 👈 NOUVEAU
            dto = new SupermarketResponseDTO();
            dto.setType("SUPERMARKET");
        } else {
            throw new IllegalArgumentException("Type d'entité non supporté : " + entity.getClass().getSimpleName());
        }

        // 2. On copie les propriétés simples
        BeanUtils.copyProperties(entity, dto);

        // 3. Transformation du Store (si chargé)
        if (entity.getStore() != null) {
            dto.setStore(storeMapper.toDto(entity.getStore()));
        }

        return dto;
    }
}
