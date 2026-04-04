package cf.order_service.feignClient;

import cf.order_service.dto.priceDto.PriceRequestDto;
import cf.order_service.dto.priceDto.PriceResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "eta-service", url = "${ETA_SERVICE_URL:http://localhost:8085}")
public interface PriceFeignClient {

    @PostMapping("/v1/price/calculate")
    PriceResponseDto calculatePrice(@RequestBody PriceRequestDto request);
}
