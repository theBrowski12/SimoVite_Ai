package cf.catalog_service.entities;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    private String city;
    private String street;
    private String buildingNumber;
    private String apartment;
    private Double latitude;
    private Double longitude;
}
