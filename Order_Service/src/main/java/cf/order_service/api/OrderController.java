package cf.order_service.api;

import cf.order_service.dto.OrderRequestDto;
import cf.order_service.dto.OrderResponseDto;
import cf.order_service.enums.OrderStatus;
import cf.order_service.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "Endpoints pour la gestion des commandes et des articles")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(
            summary = "Créer une nouvelle commande",
            description = "Enregistre une commande en base, calcule le prix total et envoie un événement Kafka pour notification.",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Commande créée avec succès"),
                    @ApiResponse(responseCode = "400", description = "Données invalides")
            }
    )
    public ResponseEntity<OrderResponseDto> createOrder(@RequestBody OrderRequestDto request) {
        return new ResponseEntity<>(orderService.createOrder(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une commande par son ID technique")
    public ResponseEntity<OrderResponseDto> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping
    @Operation(
            summary = "Récupérer toutes les commandes",
            description = "Retourne la liste complète de toutes les commandes enregistrées."
    )
    public ResponseEntity<List<OrderResponseDto>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/ref/{ref}")
    @Operation(summary = "Trouver une commande par sa référence (ex: SV2026...)")
    public ResponseEntity<OrderResponseDto> getOrderByRef(@PathVariable String ref) {
        return ResponseEntity.ok(orderService.getOrderByRef(ref));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lister toutes les commandes d'un utilisateur spécifique")
    public ResponseEntity<List<OrderResponseDto>> getOrdersByUser(@PathVariable String userId) {
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Mettre à jour uniquement le statut d'une commande via id")
    public ResponseEntity<OrderResponseDto> updateStatus(
            @PathVariable Long id,
            @Parameter(description = "Nouveau statut (PENDING, ACCEPTED, DELIVERED, etc.)")
            @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Simuler la validation du paiement en ligne")
    public ResponseEntity<OrderResponseDto> confirmPayment(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.confirmOnlinePayment(id));
    }

    @PutMapping("/ref/{orderRef}/status")
    @Operation(summary = "Mettre à jour le statut via la référence de commande (utilisé par Delivery_Service)")
    public ResponseEntity<OrderResponseDto> updateStatusByRef(
            @PathVariable String orderRef,
            @Parameter(description = "Nouveau statut") @RequestParam OrderStatus status) {

        return ResponseEntity.ok(orderService.updateOrderStatusByRef(orderRef, status));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une commande complète (Adresse, articles, etc.)")
    public ResponseEntity<OrderResponseDto> updateOrder(@PathVariable Long id, @RequestBody OrderRequestDto request) {
        return ResponseEntity.ok(orderService.updateOrder(id, request));
    }

    @PatchMapping("/{id}/apply-promotion")
    @Operation(summary = "Appliquer une remise en pourcentage sur le prix total")
    public ResponseEntity<OrderResponseDto> applyPromotion(
            @PathVariable Long id,
            @RequestParam Double percentage) {
        return ResponseEntity.ok(orderService.applyDiscount(id, percentage));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Supprimer une commande",
            description = "Supprime définitivement une commande et ses articles associés par son ID."
    )
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build(); // Retourne un statut 204 No Content (Standard REST)
    }
}
