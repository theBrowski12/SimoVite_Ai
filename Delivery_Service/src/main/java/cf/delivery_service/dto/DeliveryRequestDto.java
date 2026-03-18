package cf.delivery_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRequestDto {
    private String orderRef;

    // Utilisation des objets structurés
    private AddressDto pickupAddress; //seulement pour SpecialDelivery ,sinon on recoit l'adresse du store comme pickupAddress,
    private AddressDto dropoffAddress;// l'adresse qu'on va crée une nouvelle delivery avec
}
