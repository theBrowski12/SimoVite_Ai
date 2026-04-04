import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DeliveryService } from '@services/delivery.service';
import { Delivery } from '@models/delivery.model';

@Component({
  selector: 'app-history',
  standalone: false,
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  pastDeliveries: Delivery[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  private loadHistory(): void {
    this.isLoading = true;
    
    this.deliveryService.getMine().subscribe({
      next: (deliveries) => {
        // On filtre pour ne garder QUE les livraisons terminées ou annulées
        this.pastDeliveries = deliveries.filter(
          (d) => d.status === 'DELIVERED' || d.status === 'CANCELLED'
        );
        
        // Optionnel : Trier par ID décroissant (pour avoir les plus récentes en haut)
        this.pastDeliveries.sort((a, b) => b.id - a.id);

        this.isLoading = false;
        this.cdr.detectChanges(); // Force la mise à jour de la vue
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'historique', err);
        this.errorMessage = 'Impossible de charger votre historique.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}