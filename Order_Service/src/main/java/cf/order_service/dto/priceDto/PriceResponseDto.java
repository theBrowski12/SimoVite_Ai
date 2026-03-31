package cf.order_service.dto.priceDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceResponseDto{
    private double delivery_cost;
    private double price_percentage;
}
