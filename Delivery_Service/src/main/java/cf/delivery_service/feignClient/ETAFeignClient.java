package cf.delivery_service.feignClient;

import cf.delivery_service.dto.ETA.ETARequest;
import cf.delivery_service.dto.ETA.ETAResponse;
import cf.delivery_service.dto.StoreResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

// ETAFeignClient.java
@FeignClient(name = "eta-service", url = "${ETA_SERVICE_URL:http://localhost:8085}")
public interface ETAFeignClient {
    @CircuitBreaker(name = "eta-service", fallbackMethod = "getDefault")
    @PostMapping("/v1/eta/calculate")
    ETAResponse calculateETA(@RequestBody ETARequest request);

    default ETAResponse getDefault(ETARequest request, Exception e) {
        System.out.println("❌ eta-service indisponible — fallback pour eta-service : " + request + " | Erreur: " + e.getMessage());
        return ETAResponse.builder()
                .etaPercentage(0.0)
                .distanceKm(0.0)
                .estimatedMinutes(0)
                .rushHourFactor(0.0)
                .rushHourFactor(0.0)
                .build();
    }
}
