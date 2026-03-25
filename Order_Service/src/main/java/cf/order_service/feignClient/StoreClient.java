package cf.order_service.feignClient;

import cf.order_service.dto.storeDto.StoreResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "catalog-service", path = "/v1/stores", contextId = "storeClient")
public interface StoreClient {

    @GetMapping("/{id}")
    @CircuitBreaker(name = "catalog-service", fallbackMethod = "getDefaultStore")
    StoreResponseDto getStoreById(@PathVariable("id") String storeId);

    default StoreResponseDto getDefaultStore(String storeId, Exception e) {
        System.out.println("❌ StoreService indisponible — fallback pour store : " + storeId + " | Erreur: " + e.getMessage());
        return StoreResponseDto.builder()
                .id(storeId)
                .name("Store Not found")
                .category("UNKNOWN")
                .build();
    }
}
