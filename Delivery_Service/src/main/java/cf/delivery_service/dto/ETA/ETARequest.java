package cf.delivery_service.dto.ETA;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// ETARequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ETARequest {

    @JsonProperty("distance_km")
    private Double distanceKm;

    @JsonProperty("vehicle_type")
    private String vehicleType;

    @JsonProperty("pickup_latitude")
    private Double pickupLatitude;

    @JsonProperty("pickup_longitude")
    private Double pickupLongitude;
}
