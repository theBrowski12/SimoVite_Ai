package cf.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    private String city;
    private String street;
    private String buildingNumber;
    private String apartment;
    private Double latitude;
    private Double longitude;
}
