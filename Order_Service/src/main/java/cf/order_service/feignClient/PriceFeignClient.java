package cf.order_service.feignClient;

import cf.order_service.dto.priceDto.PriceRequestDto;
import cf.order_service.dto.priceDto.PriceResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.math.BigDecimal;

@FeignClient(name = "eta-service", url = "${ETA_SERVICE_URL:http://localhost:8085}")
public interface PriceFeignClient {

    @PostMapping("/v1/price/calculate")
    @CircuitBreaker(name = "eta-service", fallbackMethod = "calculatePriceFallback")
    PriceResponseDto calculatePrice(@RequestBody PriceRequestDto request);

    // Fallback method - must have same signature + Exception parameter
    default PriceResponseDto calculatePriceFallback(PriceRequestDto request, Exception e) {
        System.out.println("❌ ETA Service indisponible — fallback pour le calcul de prix | Erreur: " + e.getMessage());

        // Return a default/fallback response
        return PriceResponseDto.builder()
                .delivery_cost(request.getOrder_total()*0.2)
                .price_percentage(10)
                .build();
    }
}
