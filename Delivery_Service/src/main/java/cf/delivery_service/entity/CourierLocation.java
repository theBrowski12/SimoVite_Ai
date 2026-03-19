package cf.delivery_service.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("courier_location")
public class CourierLocation {

    @Id
    private String courierId;      // clé : "courier_location:{courierId}"
    private Double latitude;
    private Double longitude;
    private String updatedAt;

    @TimeToLive
    @Builder.Default
    private Long ttl = 300L;       // expire après 5 min d'inactivité
}
