package cf.delivery_service.feignClient;

import cf.delivery_service.dto.StoreResponseDto;
import cf.delivery_service.enums.OrderStatus;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ORDER-SERVICE")
public interface OrderClient {
    @PutMapping("/v1/orders/ref/{orderRef}/status")
    @CircuitBreaker(name = "ORDER-SERVICE", fallbackMethod = "updateOrderStatusFallback")
    void updateOrderStatus(@PathVariable("orderRef") String orderRef, @RequestParam("status") OrderStatus status);

    default void updateOrderStatusFallback(String orderRef, OrderStatus status, Exception e) {
        System.out.println("❌ Failed to update order status — fallback for order: " + orderRef + " | Error: " + e.getMessage());
    }
}
