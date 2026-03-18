package cf.order_service.repository;

import cf.order_service.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Trouver tous les items vendus pour un produit spécifique (Catalog ID)
    List<OrderItem> findByProductId(String productId);
}
