package cf.catalog_service.feignClients;

import cf.catalog_service.dto.sentiment.SentimentRequest;
import cf.catalog_service.dto.sentiment.SentimentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "eta-service", url = "${ETA_SERVICE_URL:http://localhost:8085}")
public interface SentimentFeignClient {

    @PostMapping("/v1/sentiment/analyze")
    SentimentResponse analyzeSentiment(@RequestBody SentimentRequest request);
}
