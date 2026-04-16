package cf.order_service.mapper;

import cf.order_service.dto.OrderRequestDto;
import cf.order_service.dto.OrderResponseDto;
import cf.order_service.dto.specialDelivery.SpecialDeliveryRequestDto;
import cf.order_service.dto.specialDelivery.SpecialDeliveryResponseDto;
import cf.order_service.entity.Address;
import cf.order_service.entity.Order;
import cf.order_service.entity.OrderItem;
import cf.order_service.enums.OrderType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor // Injecte automatiquement OrderItemMapper
public class OrderMapper {

    private final OrderItemMapper itemMapper;

    public Order toEntity(OrderRequestDto dto) {
        if (dto == null) return null;

        Order order = new Order();
        BeanUtils.copyProperties(dto, order);
        order.setOrderType(OrderType.REGULAR);
        if (dto.getPaymentMethod() != null) {
            order.setPaymentMethod(dto.getPaymentMethod());
        }
        if (dto.getItems() != null) {
            List<OrderItem> items = dto.getItems().stream()
                    .map(itemDto -> {
                        OrderItem item = itemMapper.toEntity(itemDto);
                        item.setOrder(order); // Lien critique pour la clé étrangère SQL
                        return item;
                    })
                    .collect(Collectors.toList());
            order.setItems(items);
        }

        return order;
    }

    public OrderResponseDto toResponseDto(Order entity) {
        if (entity == null) return null;

        OrderResponseDto dto = new OrderResponseDto();
        BeanUtils.copyProperties(entity, dto);
        if (entity.getPaymentMethod() != null) {
            dto.setPaymentMethod(String.valueOf(entity.getPaymentMethod()));
            // ⚠️ NOTE : Si 'paymentMethod' dans ton OrderResponseDto est de type String
            // au lieu de l'Enum, utilise plutôt : dto.setPaymentMethod(entity.getPaymentMethod().name());
        }
        if (entity.getItems() != null) {
            dto.setItems(itemMapper.toResponseDtoList(entity.getItems()));
        }

        return dto;
    }

    // ==========================================
    // 📦 2. SPECIAL DELIVERIES (C2C Packages)
    // ==========================================

    public Order specialDeliveryToEntity(SpecialDeliveryRequestDto dto) {
        if (dto == null) return null;

        Order order = new Order();

        // 1. Automatically copy all matching flat fields
        // This now INCLUDES storeId, storeName, and storeCategory dynamically!
        BeanUtils.copyProperties(dto, order);
        order.setOrderType(OrderType.SPECIAL_DELIVERY);

        // 2. Map Addresses
        if (dto.getDropoffAddress() != null) {
            Address dropOff = new Address();
            BeanUtils.copyProperties(dto.getDropoffAddress(), dropOff);
            order.setDeliveryAddress(dropOff);
        }

        if (dto.getPickupAddress() != null) {
            Address pickUp = new Address();
            BeanUtils.copyProperties(dto.getPickupAddress(), pickUp);
            order.setPickUpAddress(pickUp);
        }
        return order;
    }
    public SpecialDeliveryResponseDto toSpecialDeliveryResponseDto(Order entity) {
        if (entity == null) return null;

        SpecialDeliveryResponseDto dto = new SpecialDeliveryResponseDto();

        // 1. This ONE line copies the base Order fields AND all the special logistics fields!
        // (Since pickUpAddress, senderPhone, weight, etc., match perfectly in name and type)
        BeanUtils.copyProperties(entity, dto);

        // 2. Fix Enums and Nested Lists
        if (entity.getPaymentMethod() != null) {
            dto.setPaymentMethod(entity.getPaymentMethod());
        }

        return dto;
    }
}
