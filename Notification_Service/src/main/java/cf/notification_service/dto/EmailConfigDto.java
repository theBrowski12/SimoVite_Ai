package cf.notification_service.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EmailConfigDto {
    private final String host;
    private final String port;
    private final String sender;

}
