package cf.delivery_service.api;

import cf.delivery_service.dto.DeliveryResponseDto;
import cf.delivery_service.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    @Operation(summary = "Lister les livraisons en attente", description = "Récupère toutes les livraisons ayant le statut PENDING, disponibles pour les livreurs.")
    public ResponseEntity<List<DeliveryResponseDto>> getPendingDeliveries() {
        return ResponseEntity.ok(deliveryService.getPendingDeliveries());
    }

    // 2. Voir mon historique et mes commandes en cours
    @GetMapping("/courier/{courierId}")
    @Operation(summary = "Historique du livreur", description = "Récupère toutes les livraisons (en cours ou terminées) assignées à un livreur spécifique.")
    public ResponseEntity<List<DeliveryResponseDto>> getMyDeliveries(
            @Parameter(description = "ID du livreur") @PathVariable String courierId) {

        return ResponseEntity.ok(deliveryService.getMyDeliveries(courierId));
    }

    // 3. Accepter une course
    // On utilise PUT car on met à jour l'état d'une ressource existante
    @PutMapping("/{id}/accept")
    @Operation(summary = "Accepter une livraison", description = "Assigne un livreur à une commande et notifie le client que le livreur est en route.")
    public ResponseEntity<DeliveryResponseDto> acceptDelivery(
            @Parameter(description = "ID de la livraison") @PathVariable Long id,
            @Parameter(description = "ID du livreur (ex: cour-123)") @RequestParam String courierId,
            @Parameter(description = "Email du client pour la notification") @RequestParam String customerEmail) {

        return ResponseEntity.ok(deliveryService.acceptDelivery(id, courierId, customerEmail));
    }

    // 4. Marquer une course comme livrée
    @PutMapping("/{id}/complete")
    @Operation(summary = "Clôturer une livraison", description = "Marque la livraison comme terminée (DELIVERED) et envoie un email de remerciement au client.")
    public ResponseEntity<DeliveryResponseDto> completeDelivery(
            @Parameter(description = "ID de la livraison") @PathVariable Long id,
            @Parameter(description = "Email du client pour la notification") @RequestParam String customerEmail) {

        return ResponseEntity.ok(deliveryService.completeDelivery(id, customerEmail));
    }

    // ==========================================
    // 💻 ENDPOINTS POUR LE DASHBOARD ADMIN
    // ==========================================

    // 5. Voir toutes les livraisons (Vue globale pour le superviseur)
    @GetMapping("/all")
    @Operation(summary = "Toutes les livraisons (Admin)", description = "Récupère l'intégralité des livraisons du système pour le tableau de bord administrateur.")
    public ResponseEntity<List<DeliveryResponseDto>> getAllDeliveries() {
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "delete Delivery", description = "delete Delivery")
    public void deleteDelivery(@PathVariable Long id) {
        deliveryService.deleteDelivery(id);
    }
}
