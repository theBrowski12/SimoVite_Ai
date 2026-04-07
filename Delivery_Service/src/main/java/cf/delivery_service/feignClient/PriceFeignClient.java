package cf.delivery_service.feignClient;

import cf.delivery_service.dto.ETA.ETARequest;
import cf.delivery_service.dto.ETA.ETAResponse;
import cf.delivery_service.dto.pricePred.PriceRequest;
import cf.delivery_service.dto.pricePred.PriceResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "price-service", url = "${ETA_SERVICE_URL:http://localhost:8085}")
public interface PriceFeignClient {
    @CircuitBreaker(name = "eta-service", fallbackMethod = "getDefault")
    @PostMapping("/v1/price/calculate")
    PriceResponse calculatePrice(@RequestBody PriceRequest request);
    default PriceResponse getDefault(PriceRequest request, Exception e) {
        System.out.println("❌ eta-service indisponible — fallback pour eta-service : " + request + " | Erreur: " + e.getMessage());
        return PriceResponse.builder()
                .category(request.getCategory())
                .pricePercentage(0.0)
                .deliveryCost(0.0)
                .distanceKm(0.0)
                .rushHourFactor(0.0)
                .vehicleType(request.getVehicleType())
                .weatherCondition("CLEAR")
                .build();
    }
}
