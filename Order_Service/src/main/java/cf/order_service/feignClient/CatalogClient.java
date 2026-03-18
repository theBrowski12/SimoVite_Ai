package cf.order_service.feignClient;

import cf.order_service.dto.catalogDto.CatalogResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "catalog-service")
public interface CatalogClient {

    @GetMapping("/v1/catalog/{id}")
    CatalogResponseDto getProductById(@PathVariable("id") String id);
}
