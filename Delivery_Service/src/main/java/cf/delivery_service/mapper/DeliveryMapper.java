package cf.delivery_service.mapper;

import cf.delivery_service.dto.AddressDto;
import cf.delivery_service.dto.DeliveryRequestDto;
import cf.delivery_service.dto.DeliveryResponseDto;
import cf.delivery_service.entity.Address;
import cf.delivery_service.entity.Delivery;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

@Component
public class DeliveryMapper {

    public Delivery toEntity(DeliveryRequestDto dto) {
        if (dto == null) return null;

        Delivery delivery = new Delivery();
        BeanUtils.copyProperties(dto, delivery, "pickupAddress", "dropoffAddress"); // On ignore les adresses pour les faire manuellement

        delivery.setPickupAddress(mapAddress(dto.getPickupAddress()));
        delivery.setDropoffAddress(mapAddress(dto.getDropoffAddress()));

        return delivery;
    }

    public DeliveryResponseDto toDto(Delivery entity) {
        if (entity == null) return null;

        DeliveryResponseDto dto = new DeliveryResponseDto();
        BeanUtils.copyProperties(entity, dto, "pickupAddress", "dropoffAddress");

        dto.setPickupAddress(mapAddressDto(entity.getPickupAddress()));
        dto.setDropoffAddress(mapAddressDto(entity.getDropoffAddress()));

        return dto;
    }

    // --- Méthodes privées pour copier les adresses ---

    private Address mapAddress(AddressDto dto) {
        if (dto == null) return null;
        Address address = new Address();
        BeanUtils.copyProperties(dto, address);
        return address;
    }

    private AddressDto mapAddressDto(Address entity) {
        if (entity == null) return null;
        AddressDto dto = new AddressDto();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }
}
