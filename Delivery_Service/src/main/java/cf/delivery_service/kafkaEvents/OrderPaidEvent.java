package cf.delivery_service.kafkaEvents;

import cf.delivery_service.entity.Address;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    // 🚦 NOUVEAU : Indispensable pour séparer la logique Food vs Colis
    private String orderType; // "REGULAR" ou "SPECIAL_DELIVERY"

    private String userName;
    private BigDecimal totalAmount;
    private boolean cashOnDelivery;

    // 📍 Adresses
    private Address deliveryAddress; // Drop-off
    private Address pickUpAddress;   // 👈 NOUVEAU : Point de départ pour le colis

    private String storeId;

    @JsonProperty("email")
    private String customerEmail;

    private String message;
    private BigDecimal deliveryCost;
    private String storeCategory;

    // 📦 NOUVEAU : Infos spécifiques aux colis (Ignorées si orderType == REGULAR)
    private String productName;
    private Double totalWeightKg;
    private String instructions;

    // 📞 NOUVEAU : Contacts pour le livreur
    private String senderName;
    private String senderPhone;
    private String receiverName;
    private String receiverPhone;
}
