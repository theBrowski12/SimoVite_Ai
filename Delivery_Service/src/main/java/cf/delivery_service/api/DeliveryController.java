package cf.delivery_service.api;

import cf.delivery_service.dto.CourierLocationRequest;
import cf.delivery_service.dto.DeliveryResponseDto;
import cf.delivery_service.enums.VehicleType;
import cf.delivery_service.service.DeliveryService;
import cf.delivery_service.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/deliveries")
@RequiredArgsConstructor
@Tag(name = "🚚 Delivery API", description = "Gestion des livraisons pour les coursiers et les administrateurs")
public class DeliveryController {

    private final DeliveryService deliveryService;

    // ==========================================
    // 🏍️ ENDPOINTS POUR L'APPLICATION LIVREUR
    // ==========================================

    // 1. Voir la carte avec les offres de livraison disponibles
    @GetMapping("/pending")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(summary = "Lister les livraisons en attente", description = "Récupère toutes les livraisons ayant le statut PENDING, disponibles pour les livreurs.")
    public ResponseEntity<List<DeliveryResponseDto>> getPendingDeliveries() {
        return ResponseEntity.ok(deliveryService.getPendingDeliveries());
    }

    // 2. Voir mon historique et mes commandes en cours
    @GetMapping("/my-deliveries")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(summary = "Historique du livreur")
    public ResponseEntity<List<DeliveryResponseDto>> getMyDeliveries() {
        String courierId = JwtUtils.getUserId();
        return ResponseEntity.ok(deliveryService.getMyDeliveries(courierId));
    }

    // 3. Accepter une course
    // On utilise PUT car on met à jour l'état d'une ressource existante
    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(summary = "Accepter une livraison")
    public ResponseEntity<DeliveryResponseDto> acceptDelivery(@PathVariable Long id,
                                                              @RequestParam VehicleType vehicleType,
                                                              @RequestBody CourierLocationRequest request) {
        String courierId   = JwtUtils.getUserId();
        String courierName = JwtUtils.getFullName();
        return ResponseEntity.ok(deliveryService.acceptDelivery(id, courierId, courierName, vehicleType, request));
    }

    // 4. Marquer une course comme livrée
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(summary = "Clôturer une livraison")
    public ResponseEntity<DeliveryResponseDto> completeDelivery(@PathVariable Long id) {
        return ResponseEntity.ok(deliveryService.completeDelivery(id));
    }


    @PostMapping("/courier/location")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(summary = "Mettre à jour la position du livreur")
    public ResponseEntity<Void> updateLocation(@RequestBody CourierLocationRequest req) {
        String courierId = JwtUtils.getUserId();
        deliveryService.updateCourierLocation(courierId, req);
        return ResponseEntity.ok().build();
    }
    // ==========================================
    // 💻 ENDPOINTS POUR LE DASHBOARD ADMIN
    // ==========================================

    // 5. Voir toutes les livraisons (Vue globale pour le superviseur)
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toutes les livraisons (Admin)", description = "Récupère l'intégralité des livraisons du système pour le tableau de bord administrateur.")
    public ResponseEntity<List<DeliveryResponseDto>> getAllDeliveries() {
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "delete Delivery", description = "delete Delivery")
    public void deleteDelivery(@PathVariable Long id) {
        deliveryService.deleteDelivery(id);
    }
}
