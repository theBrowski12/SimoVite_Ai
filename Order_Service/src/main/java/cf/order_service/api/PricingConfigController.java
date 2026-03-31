package cf.order_service.api;

import cf.order_service.entity.PricingConfig; // À adapter selon ton package entity
import cf.order_service.repository.PricingConfigRepository; // À adapter selon ton package repository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/orders/admin/config")
@PreAuthorize("hasRole('ADMIN')")
public class PricingConfigController {

    @Autowired
    private PricingConfigRepository repo;

    @GetMapping("/pricing")
    public PricingConfig getPricing() {
        return repo.findById(1L).orElseGet(PricingConfig::new);
    }

    @PutMapping("/pricing")
    public PricingConfig savePricing(@RequestBody PricingConfig config) {
        config.setId(1L);
        return repo.save(config);
    }
}
