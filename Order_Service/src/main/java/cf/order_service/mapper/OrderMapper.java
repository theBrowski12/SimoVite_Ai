package cf.order_service.mapper;

import cf.order_service.dto.OrderRequestDto;
import cf.order_service.dto.OrderResponseDto;
import cf.order_service.entity.Order;
import cf.order_service.entity.OrderItem;
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

        if (entity.getItems() != null) {
            dto.setItems(itemMapper.toResponseDtoList(entity.getItems()));
        }

        return dto;
    }
}
