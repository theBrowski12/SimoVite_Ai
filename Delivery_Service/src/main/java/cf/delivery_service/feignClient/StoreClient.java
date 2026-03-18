package cf.delivery_service.feignClient;

import cf.delivery_service.dto.AddressDto;
import cf.delivery_service.dto.StoreResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "CATALOG-SERVICE", path = "/v1/stores") // Ajuste selon ton nom Eureka
public interface StoreClient {

    @GetMapping("/{id}")
    StoreResponseDto getStoreById(@PathVariable("id") String storeId);
}
