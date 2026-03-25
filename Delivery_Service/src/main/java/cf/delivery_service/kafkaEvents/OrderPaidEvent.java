package cf.delivery_service.kafkaEvents;

import cf.delivery_service.dto.AddressDto;
import cf.delivery_service.entity.Address;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderPaidEvent {
    private String eventType;
    private String orderRef;
    private String userName;
    private BigDecimal totalAmount;
    private boolean cashOnDelivery;
    private Address deliveryAddress; // Le string reçu de l'Order
    private String storeId;
    @com.fasterxml.jackson.annotation.JsonProperty("email") // 🟢 AJOUTE CECI
    private String customerEmail;
    // Fourni par le client lors du checkout
    private String message; // Optionnel (ex: "Code d'entrée 1234")
    // OrderPaidEvent.java — vérifie que tu as ces champs
    private String storeCategory;   // RESTAURANT / PHARMACY / SUPERMARKET

}
