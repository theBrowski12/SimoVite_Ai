package cf.delivery_service.repository;

import cf.delivery_service.entity.Delivery;
import cf.delivery_service.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    // Pour que le livreur voie toutes les commandes en attente
    List<Delivery> findByStatus(DeliveryStatus status);

    // Pour retrouver une livraison via la référence de la commande
    Optional<Delivery> findByOrderRef(String orderRef);

    List<Delivery> findByCourierId(String courierId);

    List<Delivery> findByStoreId(String storeId);
}
