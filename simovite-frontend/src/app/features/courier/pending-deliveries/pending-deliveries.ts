import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '@services/delivery.service'; // Ajuste le chemin si besoin

@Component({
  selector: 'app-pending-deliveries',
  standalone: false,
  templateUrl: './pending-deliveries.html',
  styleUrl: './pending-deliveries.scss',
})
export class PendingDeliveries implements OnInit {

  // La liste est maintenant vide au départ
  availableDeliveries: any[] = [];
  
  // Variables d'état pour une bonne UX
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private deliveryService: DeliveryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 🌟 Au chargement de la page, on récupère les vraies données
    this.fetchDeliveries();
  }

  fetchDeliveries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.deliveryService.getPending().subscribe({
      next: (data) => {
        this.availableDeliveries = data;
        this.isLoading = false;
        this.cdr.detectChanges(); // Forcer la mise à jour de l'UI après avoir reçu les données
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des commandes:', error);
        this.errorMessage = "Impossible de charger les livraisons disponibles. Veuillez réessayer.";
        this.isLoading = false;
        this.cdr.detectChanges(); // Forcer la mise à jour de l'UI en cas d'erreur
      }
    });
  }

  getAverageDistance(): string {
    if (this.availableDeliveries.length === 0) return '0';
    const total = this.availableDeliveries.reduce((sum, d) => sum + (d.distanceInKm || 0), 0);
    return (total / this.availableDeliveries.length).toFixed(1);
  }

  getTotalEarnings(): number {
    return this.availableDeliveries.reduce((sum, d) => sum + (d.deliveryCost || 0), 0);
  }

  // 🌟 Méthode pour rediriger le livreur vers la page de "preview" avec la carte
  previewDelivery(deliveryId: number): void {
    this.router.navigate(['/courier/preview', deliveryId]);
  }
}