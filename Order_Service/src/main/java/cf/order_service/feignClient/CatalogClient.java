package cf.order_service.feignClient;

import cf.order_service.dto.catalogDto.CatalogResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;

@FeignClient(name = "catalog-service")
public interface CatalogClient {

    @GetMapping("/v1/catalog/{id}")
    @CircuitBreaker(name = "catalog-service", fallbackMethod = "getDefaultProduct")
    CatalogResponseDto getProductById(@PathVariable("id") String id);

    default CatalogResponseDto getDefaultProduct(String id, Exception e) {
        System.out.println("❌ CatalogService indisponible — fallback pour produit : " + id + " | Erreur: " + e.getMessage());
        return CatalogResponseDto.builder()
                .id(id)
                .name("Produit indisponible")
                .basePrice(BigDecimal.ZERO)
                .storeId("N/A")
                .build();
    }
}
