package cf.delivery_service.feignClient;

import cf.delivery_service.enums.OrderStatus;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ORDER-SERVICE") // N'oublie pas le tiret !
public interface OrderClient {
    @PatchMapping("/v1/orders/ref/{orderRef}/status")
    void updateOrderStatus(@PathVariable("orderRef") String orderRef, @RequestParam("status") OrderStatus status);
}
