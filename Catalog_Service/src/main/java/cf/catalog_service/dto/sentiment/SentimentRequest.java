package cf.catalog_service.dto.sentiment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentRequest {
    @JsonProperty("comment") private String comment;
    @JsonProperty("rating")  private Double rating;
}
