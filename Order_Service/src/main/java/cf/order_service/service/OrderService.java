package cf.order_service.service;

import cf.order_service.dto.OrderRequestDto;
import cf.order_service.dto.OrderResponseDto;
import cf.order_service.enums.OrderStatus;

import java.util.List;

public interface OrderService {
    OrderResponseDto createOrder(OrderRequestDto orderRequestDto);
    OrderResponseDto updateOrder(Long id, OrderRequestDto orderRequestDto);
    void deleteOrder(Long id);
    List<OrderResponseDto> getOrdersByStoreId(String storeId);
    List<OrderResponseDto> getAllOrders();
    OrderResponseDto getOrderById(Long id);
    OrderResponseDto getOrderByRef(String ref);
    List<OrderResponseDto> getOrdersByUserId(String userId);
    OrderResponseDto updateOrderStatus(Long id, OrderStatus status);
    OrderResponseDto updateOrderStatusByRef(String orderRef, OrderStatus status);
    OrderResponseDto applyDiscount(Long id, Double percentage);
    OrderResponseDto confirmOnlinePayment(Long id);
}
