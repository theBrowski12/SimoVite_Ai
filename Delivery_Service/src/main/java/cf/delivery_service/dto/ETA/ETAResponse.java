package cf.delivery_service.dto.ETA;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ETAResponse {
    @JsonProperty("estimated_minutes")
    private Integer estimatedMinutes;

    @JsonProperty("distance_km")
    private Double distanceKm;

    @JsonProperty("vehicle_type")
    private String vehicleType;

    @JsonProperty("weather_condition")
    private String weatherCondition;

    @JsonProperty("weather_factor")
    private Double weatherFactor;

    @JsonProperty("rush_hour_factor")
    private Double rushHourFactor;

    @JsonProperty("eta_percentage")  private Double etaPercentage;
}
