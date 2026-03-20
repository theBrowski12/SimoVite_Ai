package cf.delivery_service.feignClient;

import cf.delivery_service.dto.ETA.ETARequest;
import cf.delivery_service.dto.ETA.ETAResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

// ETAFeignClient.java
@FeignClient(name = "eta-service", url = "${ETA_SERVICE_URL:http://localhost:8085}")
public interface ETAFeignClient {

    @PostMapping("/api/eta/calculate")
    ETAResponse calculateETA(@RequestBody ETARequest request);
}
