package cf.order_service.dto.catalogDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogResponseDto {
    private String id;
    private String name;
    private BigDecimal basePrice;
    private String storeId;


}
