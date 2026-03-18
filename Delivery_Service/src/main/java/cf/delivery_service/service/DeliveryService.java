package cf.delivery_service.service;

import cf.delivery_service.dto.DeliveryResponseDto;
import cf.delivery_service.kafkaEvents.OrderPaidEvent;

import java.util.List;

public interface DeliveryService {

    // Récupérer la liste des commandes en attente pour les livreurs
    List<DeliveryResponseDto> getPendingDeliveries();
    void createDeliveryFromOrder(OrderPaidEvent event);
    // Le livreur accepte une commande
    DeliveryResponseDto acceptDelivery(Long deliveryId, String courierId, String customerEmail);

    // Le livreur termine la livraison
    DeliveryResponseDto completeDelivery(Long deliveryId, String customerEmail);

    // Pour l'historique du livreur
    List<DeliveryResponseDto> getMyDeliveries(String courierId);
    void deleteDelivery(Long deliveryId);
    // Pour le Dashboard Administrateur (Statistiques, monitoring)
    List<DeliveryResponseDto> getAllDeliveries();
}
