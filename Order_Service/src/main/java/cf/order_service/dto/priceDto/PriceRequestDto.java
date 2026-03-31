package cf.order_service.dto.priceDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceRequestDto {
    private double distance_km;
    private String vehicle_type;
    private String category;
    private double pickup_latitude;
    private double pickup_longitude;
    private double order_total;
}
