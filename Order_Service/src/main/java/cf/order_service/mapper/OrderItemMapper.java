package cf.order_service.mapper;

import cf.order_service.dto.OrderItemRequestDto;
import cf.order_service.dto.OrderItemResponseDto;
import cf.order_service.entity.OrderItem;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrderItemMapper {

    public OrderItem toEntity(OrderItemRequestDto dto) {
        if (dto == null) return null;
        OrderItem entity = new OrderItem();
        BeanUtils.copyProperties(dto, entity);
        return entity;
    }

    public OrderItemResponseDto toResponseDto(OrderItem entity) {
        if (entity == null) return null;
        OrderItemResponseDto dto = new OrderItemResponseDto();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }

    public List<OrderItemResponseDto> toResponseDtoList(List<OrderItem> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }
}
