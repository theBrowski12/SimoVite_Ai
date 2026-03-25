package cf.delivery_service.dto.pricePred;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceRequest {
    @JsonProperty("distance_km")     private Double distanceKm;
    @JsonProperty("vehicle_type")    private String vehicleType;
    @JsonProperty("category")        private String category;
    @JsonProperty("pickup_latitude") private Double pickupLatitude;
    @JsonProperty("pickup_longitude")private Double pickupLongitude;
    @JsonProperty("order_total")     private Double orderTotal;
}
