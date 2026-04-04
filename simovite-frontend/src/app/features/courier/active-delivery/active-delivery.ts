import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '@services/delivery.service';
import { Delivery } from '@models/delivery.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-active-delivery',
  standalone: false,
  templateUrl: './active-delivery.html',
  styleUrl: './active-delivery.scss',
})
export class ActiveDelivery implements OnInit, OnDestroy {
  delivery: Delivery | null = null;
  isLoading = true;
  isActionLoading = false;
  
  private geoWatchId?: number;

  constructor(
    private deliveryService: DeliveryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadActiveDelivery();
  }

  ngOnDestroy(): void {
    this.stopLocationTracking();
  }

  // 1. Charger la livraison en cours
  private loadActiveDelivery(): void {
    this.isLoading = true;
    this.deliveryService.getMine().subscribe({
      next: (deliveries) => {
        console.log('Données reçues du backend :', deliveries);
        // On cherche la livraison qui est en cours (ni PENDING, ni DELIVERED)
        const active = deliveries.find(
          (d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP'
        );

        if (active) {
          this.delivery = active;
          this.startLocationTracking(); // On commence à tracker la position
        } else {
          // Si aucune livraison active, on le renvoie à l'accueil
          this.router.navigate(['/courier/dashboard']);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la livraison', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 2. Action : Le livreur a récupéré le colis
  markAsPickedUp(): void {
    if (!this.delivery) return;
    this.isActionLoading = true;

    this.deliveryService.updateStatus(this.delivery.id, 'PICKED_UP').subscribe({
      next: (updatedDelivery) => {
        this.delivery = updatedDelivery; // Met à jour l'UI vers l'étape suivante
        this.isActionLoading = false;
        this.cdr.detectChanges();

      },
      error: (err) => {
        console.error('Erreur lors du pickup', err);
        this.isActionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 3. Action : Le livreur a livré le colis au client
  markAsDelivered(): void {
    if (!this.delivery) return;
    this.isActionLoading = true;

    this.deliveryService.complete(this.delivery.id).subscribe({
      next: () => {
        this.isActionLoading = false;
        this.stopLocationTracking();
        this.cdr.detectChanges();
        // Optionnel : Rediriger vers une page "Succès" ou les revenus
        this.router.navigate(['/courier/history']); 
      },
      error: (err) => {
        console.error('Erreur lors de la complétion', err);
        this.isActionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 4. Tracking GPS en temps réel
  private startLocationTracking(): void {
    if ('geolocation' in navigator) {
      this.geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          this.deliveryService.updateCourierLocation(
            position.coords.latitude,
            position.coords.longitude
          ).subscribe(); // Mise à jour silencieuse en arrière-plan
        },
        (error) => console.error('Erreur GPS:', error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
  }

  private stopLocationTracking(): void {
    if (this.geoWatchId !== undefined && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.geoWatchId);
    }
  }
  cancelDelivery(): void {
  if (!this.delivery) return;
  
  const reason = prompt("Veuillez indiquer le motif de l'annulation :");
  if (!reason) return; // Annule l'action si le livreur n'écrit rien

  this.isActionLoading = true;
  
  // On réutilise updateStatus avec le statut 'CANCELLED'
  this.deliveryService.updateStatus(this.delivery.id, 'CANCELLED').subscribe({
    next: () => {
      this.isActionLoading = false;
      this.stopLocationTracking();
      // On le renvoie au dashboard puisqu'il n'a plus de course active
      this.router.navigate(['/courier/dashboard']);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error("Erreur lors de l'annulation", err);
      this.isActionLoading = false;
      this.cdr.detectChanges();

    }
  });
}
}