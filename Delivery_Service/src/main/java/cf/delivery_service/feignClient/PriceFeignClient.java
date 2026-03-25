package cf.delivery_service.feignClient;

import cf.delivery_service.dto.pricePred.PriceRequest;
import cf.delivery_service.dto.pricePred.PriceResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "price-service", url = "${ETA_SERVICE_URL:http://localhost:8085}")
public interface PriceFeignClient {

    @PostMapping("/v1/price/calculate")
    PriceResponse calculatePrice(@RequestBody PriceRequest request);
}
