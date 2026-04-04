import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DeliveryService } from '@services/delivery.service';
import { DistancePreviewDto, CourierLocationRequest } from '@models/DistancePreviewDto';
import { VehicleType } from '@models/delivery.model';
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

  // Options de véhicules
  vehicles: VehicleType[] = ['MOTORCYCLE', 'BICYCLE', 'CAR', 'TRUCK'];
  selectedVehicle: VehicleType = 'MOTORCYCLE'; // Par défaut

  // Position du livreur
  currentLocation: CourierLocationRequest | null = null;
  deliveryId!: number;

  constructor(
    private deliveryService: DeliveryService,
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

  onVehicleChange(): void {
    // Recalcule l'ETA et la distance si on change de véhicule
    this.fetchPreview();
  }

  acceptDelivery(): void {
    // Appel vers le endpoint d'acceptation de commande
    console.log("Commande acceptée !");
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}