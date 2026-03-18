package cf.order_service.dto.catalogDto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CatalogResponseDto {
    private String id;
    private String name;
    private BigDecimal basePrice;
    private String storeId;
}
