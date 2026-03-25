package cf.catalog_service.dto.sentiment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SentimentResponse {
    @JsonProperty("sentiment")   private String sentiment;   // POSITIVE/NEGATIVE/MIXED
    @JsonProperty("score")       private Double score;
    @JsonProperty("confidence")  private Double confidence;
    @JsonProperty("incoherent")  private Boolean incoherent;
    @JsonProperty("alert")       private String alert;
}
