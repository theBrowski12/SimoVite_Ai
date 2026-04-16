package cf.notification_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderEvent {
    private String eventType;
    private String orderRef;

    // 🚦 Indispensable pour savoir quel template d'email envoyer !
    private String orderType; // "REGULAR" ou "SPECIAL_DELIVERY"

    private String userName;
    private String email;
    private String createdAt;
    private BigDecimal totalAmount;

    // NOUVEAU : Frais et type de paiement pour la facture
    private BigDecimal deliveryCost;
    private boolean cashOnDelivery;

    // 📦 NOUVEAU : Infos C2C (Colis)
    // Si orderType == "SPECIAL_DELIVERY", tu utiliseras ça dans l'email au lieu de la liste 'items'
    private String productName;
    private Double totalWeightKg;
    private String instructions;

    private String senderName;
    private String senderPhone;
    private String receiverName;
    private String receiverPhone;

    // 👇 La liste des articles pour les commandes de nourriture/pharmacie (REGULAR)
    private List<OrderItemEvent> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemEvent {
        private String productName;
        private int quantity;
        private BigDecimal unitPrice;
    }
}
