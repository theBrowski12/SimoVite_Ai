package cf.order_service.repository;

import cf.order_service.entity.Order;
import cf.order_service.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Trouver une commande par sa référence (SV2026...)
    Optional<Order> findByOrderRef(String orderRef);

    // Récupérer l'historique des commandes d'un utilisateur
    List<Order> findByUserId(String userId);

    // Filtrer par statut (ex: pour l'interface Admin ou Livreur)
    List<Order> findByStatus(OrderStatus status);

    // Récupérer les commandes d'un restaurant spécifique
    List<Order> findByStoreId(String storeId);
}
