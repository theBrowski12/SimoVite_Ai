package cf.delivery_service.api;

import cf.delivery_service.dto.CourierLocationRequest;
import cf.delivery_service.dto.DeliveryResponseDto;
import cf.delivery_service.dto.DistancePreviewDto;
import cf.delivery_service.enums.DeliveryStatus;
import cf.delivery_service.enums.VehicleType;
import cf.delivery_service.service.DeliveryService;
import cf.delivery_service.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/deliveries")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "🚚 Delivery API", description = "Gestion des livraisons pour les coursiers et les administrateurs")
public class DeliveryController {

    private final DeliveryService deliveryService;

    // ==========================================
    // 🏍️ ENDPOINTS POUR L'APPLICATION LIVREUR
    // ==========================================

    // 1. Voir la carte avec les offres de livraison disponibles
    @GetMapping("/pending")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(
            summary = "Lister les livraisons en attente",
            description = "Récupère toutes les livraisons ayant le statut PENDING, disponibles pour les livreurs."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des livraisons récupérée avec succès"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé")
    })
    public ResponseEntity<List<DeliveryResponseDto>> getPendingDeliveries() {
        log.info("📋 Récupération des livraisons en attente");
        return ResponseEntity.ok(deliveryService.getPendingDeliveries());
    }

    @PostMapping("/{deliveryId}/preview")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(
            summary = "Aperçu de la livraison",
            description = "Calcule la distance et l'ETA estimé pour une livraison spécifique en fonction de la position actuelle du livreur et de son véhicule. " +
                    "Permet au livreur de voir combien de temps il lui faudra pour effectuer la livraison avant de l'accepter."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Aperçu calculé avec succès",
                    content = @Content(schema = @Schema(implementation = DistancePreviewDto.class))
            ),
            @ApiResponse(responseCode = "400", description = "Requête invalide (position manquante, etc.)"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé"),
            @ApiResponse(responseCode = "404", description = "Livraison non trouvée")
    })
    public ResponseEntity<DistancePreviewDto> previewDelivery(
            @Parameter(description = "ID de la livraison à prévisualiser", required = true, example = "1")
            @PathVariable Long deliveryId,

            @Parameter(description = "Type de véhicule du livreur", required = true, example = "MOTORCYCLE")
            @RequestParam VehicleType vehicleType,

            @Parameter(description = "Position actuelle du livreur (latitude et longitude)", required = true)
            @RequestBody CourierLocationRequest courierLocationRequest) {

        log.info("🔍 Preview delivery {} for courier at ({}, {}) with vehicle {}",
                deliveryId,
                courierLocationRequest.getLatitude(),
                courierLocationRequest.getLongitude(),
                vehicleType);

        DistancePreviewDto preview = deliveryService.previewDeliveryDistance(
                deliveryId,
                courierLocationRequest,
                vehicleType);
        return ResponseEntity.ok(preview);
    }

    // 2. Voir mon historique et mes commandes en cours
    @GetMapping("/my-deliveries")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(
            summary = "Historique du livreur",
            description = "Récupère toutes les livraisons assignées au livreur connecté (en cours et terminées)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Historique récupéré avec succès"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé")
    })
    public ResponseEntity<List<DeliveryResponseDto>> getMyDeliveries() {
        String courierId = JwtUtils.getUserId();
        log.info("📦 Récupération des livraisons pour le livreur {}", courierId);
        return ResponseEntity.ok(deliveryService.getMyDeliveries(courierId));
    }

    // 3. Accepter une course
    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(
            summary = "Accepter une livraison",
            description = "Le livreur accepte une livraison en attente. La livraison passe du statut PENDING à ASSIGNED."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Livraison acceptée avec succès"),
            @ApiResponse(responseCode = "400", description = "Requête invalide"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé"),
            @ApiResponse(responseCode = "404", description = "Livraison non trouvée"),
            @ApiResponse(responseCode = "409", description = "Livraison déjà acceptée par un autre livreur")
    })
    public ResponseEntity<DeliveryResponseDto> acceptDelivery(
            @Parameter(description = "ID de la livraison à accepter", required = true, example = "1")
            @PathVariable Long id,

            @Parameter(description = "Type de véhicule du livreur", required = true, example = "MOTORCYCLE")
            @RequestParam VehicleType vehicleType,

            @Parameter(description = "Position actuelle du livreur", required = true)
            @RequestBody CourierLocationRequest request) {

        String courierId = JwtUtils.getUserId();
        String courierName = JwtUtils.getFullName();

        log.info("🚚 Courier {} accepting delivery {} with vehicle {}", courierName, id, vehicleType);

        return ResponseEntity.ok(deliveryService.acceptDelivery(id, courierId, courierName, vehicleType, request));
    }

    // 4. Marquer une course comme livrée
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(
            summary = "Clôturer une livraison",
            description = "Le livreur marque la livraison comme terminée. La livraison passe du statut ASSIGNED à DELIVERED."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Livraison clôturée avec succès"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé"),
            @ApiResponse(responseCode = "404", description = "Livraison non trouvée"),
            @ApiResponse(responseCode = "409", description = "Livraison déjà clôturée")
    })
    public ResponseEntity<DeliveryResponseDto> completeDelivery(
            @Parameter(description = "ID de la livraison à clôturer", required = true, example = "1")
            @PathVariable Long id) {

        log.info("✅ Completing delivery {}", id);
        return ResponseEntity.ok(deliveryService.completeDelivery(id));
    }

    @PostMapping("/courier/location")
    @PreAuthorize("hasRole('COURIER')")
    @Operation(
            summary = "Mettre à jour la position du livreur",
            description = "Met à jour la position GPS actuelle du livreur pour le suivi en temps réel."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Position mise à jour avec succès"),
            @ApiResponse(responseCode = "400", description = "Requête invalide"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé")
    })
    public ResponseEntity<Void> updateLocation(
            @Parameter(description = "Nouvelle position du livreur", required = true)
            @RequestBody CourierLocationRequest req) {

        String courierId = JwtUtils.getUserId();

        log.debug("📍 Updating location for courier {}: ({}, {})",
                courierId, req.getLatitude(), req.getLongitude());

        deliveryService.updateCourierLocation(courierId, req);
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // 💻 ENDPOINTS POUR LE DASHBOARD ADMIN
    // ==========================================

    // 5. Voir toutes les livraisons (Vue globale pour le superviseur)
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Toutes les livraisons (Admin)",
            description = "Récupère l'intégralité des livraisons du système pour le tableau de bord administrateur."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des livraisons récupérée avec succès"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé - réservé aux administrateurs")
    })
    public ResponseEntity<List<DeliveryResponseDto>> getAllDeliveries() {
        log.info("📊 Admin fetching all deliveries");
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Supprimer une livraison (Admin)",
            description = "Supprime définitivement une livraison du système. Utiliser avec précaution."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Livraison supprimée avec succès"),
            @ApiResponse(responseCode = "403", description = "Accès non autorisé - réservé aux administrateurs"),
            @ApiResponse(responseCode = "404", description = "Livraison non trouvée")
    })
    public void deleteDelivery(
            @Parameter(description = "ID de la livraison à supprimer", required = true, example = "1")
            @PathVariable Long id) {

        log.warn("🗑️ Admin deleting delivery {}", id);
        deliveryService.deleteDelivery(id);
    }

    // ==========================================
    // 🌐 ENDPOINTS DE LECTURE ET SUIVI (FRONTEND)
    // ==========================================

    @GetMapping("/{id}")
    @Operation(
            summary = "Récupérer une livraison par son ID",
            description = "Renvoie les détails d'une livraison spécifique via son identifiant unique."
    )
    public ResponseEntity<DeliveryResponseDto> getById(
            @Parameter(description = "ID de la livraison", required = true)
            @PathVariable Long id) {
        return ResponseEntity.ok(deliveryService.getDeliveryById(id));
    }

    @GetMapping("/order/{ref}")
    @Operation(
            summary = "Récupérer par référence commande",
            description = "Permet de trouver la livraison associée à la référence unique d'une commande."
    )
    public ResponseEntity<DeliveryResponseDto> getByOrderRef(
            @Parameter(description = "Référence de la commande", required = true)
            @PathVariable String ref) {
        return ResponseEntity.ok(deliveryService.getDeliveryByOrderRef(ref));
    }

    @GetMapping("/track/{ref}")
    @Operation(
            summary = "Suivre une livraison (Client)",
            description = "Endpoint spécifiquement conçu pour l'interface client afin de tracker la commande."
    )
    public ResponseEntity<DeliveryResponseDto> trackByOrderRef(
            @Parameter(description = "Référence de la commande", required = true)
            @PathVariable String ref) {
        // On réutilise la même logique que order/{ref} car le besoin est identique
        return ResponseEntity.ok(deliveryService.getDeliveryByOrderRef(ref));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'COURIER')")
    @Operation(
            summary = "Mettre à jour le statut manuellement",
            description = "Permet à un admin (ou système) de forcer le changement de statut d'une livraison."
    )
    public ResponseEntity<DeliveryResponseDto> updateStatus(
            @Parameter(description = "ID de la livraison", required = true)
            @PathVariable Long id,
            @Parameter(description = "Nouveau statut", required = true)
            @RequestParam DeliveryStatus status) {

        log.info("🔄 Mise à jour manuelle du statut de la livraison {} vers {}", id, status);
        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(id, status));
    }
}
