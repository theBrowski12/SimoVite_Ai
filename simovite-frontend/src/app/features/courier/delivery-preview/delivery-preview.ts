import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeliveryService } from '@services/delivery.service';
import { OrderService } from '@services/order.service';
import { DistancePreviewDto, CourierLocationRequest } from '@models/DistancePreviewDto';
import { VehicleType, OrderItemPreview } from '@models/delivery.model';
import { OrderItem } from '@models/order.model';
@Component({
  selector: 'app-delivery-preview',
  standalone: false,
  templateUrl: './delivery-preview.html',
  styleUrls: ['./delivery-preview.scss']
})
export class DeliveryPreview implements OnInit {
  previewData: DistancePreviewDto | null = null;
  isLoading = true;
  errorMessage = '';

  // Order items fetched separately
  orderItems: OrderItem[] = [];
  orderTotal = 0;

  // Options de véhicules
  vehicles: VehicleType[] = ['MOTORCYCLE', 'BICYCLE', 'CAR', 'TRUCK'];
  selectedVehicle: VehicleType = 'MOTORCYCLE'; // Par défaut

  // Position du livreur
  currentLocation: CourierLocationRequest | null = null;
  deliveryId!: number;

  isAccepting = false;

  constructor(
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID de la livraison depuis l'URL (ex: /preview/1)
    this.deliveryId = Number(this.route.snapshot.paramMap.get('id'));
    this.getLivePositionAndPreview();
  }

  getLivePositionAndPreview(): void {
    this.isLoading = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.fetchPreview();
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Erreur GPS:', error);
          this.errorMessage = "Impossible de récupérer votre position GPS.";
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      );
    } else {
      this.errorMessage = "La géolocalisation n'est pas supportée par ce navigateur.";
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  fetchPreview(): void {
    if (!this.currentLocation || !this.deliveryId) return;

    this.isLoading = true;
    this.deliveryService.previewDistance(this.deliveryId, this.selectedVehicle, this.currentLocation)
      .subscribe({
        next: (data) => {
          this.previewData = data;
          this.isLoading = false;
          console.log('📦 Preview data received:', data);
          
          // Fetch order items using orderRef
          if (data.orderRef) {
            this.fetchOrderItems(data.orderRef);
          }
          
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = "Erreur lors du calcul de l'itinéraire.";
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private fetchOrderItems(orderRef: string): void {
    this.orderService.getByRef(orderRef).subscribe({
      next: (order) => {
        this.orderItems = order.items || [];
        this.orderTotal = order.price || 0;
        console.log('🛍️ Order items loaded:', this.orderItems);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load order items:', err);
        // Non-blocking: preview still works without items
      }
    });
  }

  onVehicleChange(): void {
    // Recalcule l'ETA et la distance si on change de véhicule
    this.fetchPreview();
  }

  acceptDelivery(): void {
  // 1. Vérification de sécurité
  if (!this.deliveryId || !this.currentLocation || !this.selectedVehicle) {
    this.errorMessage = "Données de localisation ou véhicule manquantes.";
    return;
  }

  // 2. On lance le chargement
  this.isAccepting = true;
  this.errorMessage = '';
  this.cdr.detectChanges();

  // 3. Appel à ton service
  this.deliveryService.accept(
    this.deliveryId, 
    this.selectedVehicle, 
    this.currentLocation.latitude, 
    this.currentLocation.longitude
  ).subscribe({
    next: (acceptedDelivery) => {
      this.isAccepting = false;
      console.log("✅ Commande acceptée !", acceptedDelivery);
      
      // 4. Redirection vers la page de suivi de SA course (à adapter selon tes routes)
      // Par exemple : this.router.navigate(['/active-delivery', this.deliveryId]);
      this.router.navigate(['/courier/active', this.deliveryId]); 
    },
    error: (err) => {
      console.error(err);
      this.isAccepting = false;
      
      // Gérer l'erreur (ex: un autre livreur l'a prise entre temps)
      if (err.status === 400 || err.status === 409) {
         this.errorMessage = "Oups ! Cette commande n'est plus disponible.";
      } else {
         this.errorMessage = "Une erreur est survenue lors de l'acceptation.";
      }
      this.cdr.detectChanges();
    }
  });
}
  

  goBack(): void {
    this.router.navigate(['/courier/dashboard']);
  }
}