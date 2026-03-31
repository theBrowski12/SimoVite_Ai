package cf.order_service.repository;

import cf.order_service.entity.PricingConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PricingConfigRepository extends JpaRepository<PricingConfig, Long> {
    // findById() et save() sont déjà inclus par défaut dans JpaRepository !
}
