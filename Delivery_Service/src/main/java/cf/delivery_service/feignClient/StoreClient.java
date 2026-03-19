package cf.delivery_service.feignClient;

import cf.delivery_service.dto.AddressDto;
import cf.delivery_service.dto.StoreResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "CATALOG-SERVICE", path = "/v1/stores") // Ajuste selon ton nom Eureka
public interface StoreClient {

    @GetMapping("/{id}")
    @CircuitBreaker(name = "catalog-service", fallbackMethod = "getDefaultStore")
    StoreResponseDto getStoreById(@PathVariable("id") String storeId);

    default StoreResponseDto getDefaultStore(String storeId, Exception e) {
        System.out.println("❌ StoreService indisponible — fallback pour store : " + storeId + " | Erreur: " + e.getMessage());
        return StoreResponseDto.builder()
                .id(storeId)
                .name("Store Not found")
                .description("Store indisponible")
                .build();
    }
}
