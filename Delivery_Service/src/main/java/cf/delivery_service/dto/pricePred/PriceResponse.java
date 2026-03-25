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
public class PriceResponse {
    @JsonProperty("delivery_cost") private Double deliveryCost;

    @JsonProperty("distance_km") private Double distanceKm;

    @JsonProperty("vehicle_type") private String vehicleType;

    @JsonProperty("category") private String category;

    @JsonProperty("weather_condition")  private String weatherCondition;

    @JsonProperty("weather_factor") private Double weatherFactor;

    @JsonProperty("rush_hour_factor") private Double rushHourFactor;

    @JsonProperty("price_percentage")  private Double pricePercentage;


}
