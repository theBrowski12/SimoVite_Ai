import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '@services/delivery.service';
import { OrderService } from '@services/order.service';
import { NotificationService } from '@services/notification.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { Delivery } from '@models/delivery.model';
import { Order } from '@models/order.model';
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

  // Timer & ETA
  elapsedSeconds = 0;
  elapsedMinutes = 0;
  etaMinutes: number | null = null;
  private timerInterval?: any;
  private timerStartTime!: number;

  private geoWatchId?: number;

  private readonly TIMER_STORAGE_KEY = 'simovite_active_delivery_timer_start';

  constructor(
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private keycloakService: KeycloakService,
    private notifService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadActiveDelivery();
  }

  ngOnDestroy(): void {
    this.stopLocationTracking();
    this.stopTimer();
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
          this.etaMinutes = active.estimatedTimeInMinutes || null;
          this.startLocationTracking(); // On commence à tracker la position
          this.startTimer(); // Start the elapsed timer

          // Fetch customer phone from Keycloak
          this.loadCustomerPhone(active.orderRef);
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

  // Fetch customer phone number from Keycloak
  private async loadCustomerPhone(orderRef: string): Promise<void> {
    if (!this.delivery) return;

    try {
      // First fetch the order to get the customer's userId
      const order = await this.orderService.getByRef(orderRef).toPromise();
      const userId = (order as any)?.userId || '';
      
      if (userId) {
        // Fetch phone from Keycloak using the customer's userId
        const keycloakPhone = await this.keycloakService.getUserPhone(userId);
        (this.delivery as any).customerPhone = keycloakPhone;
        console.log('[ActiveDelivery] Customer userId:', userId, 'Phone:', keycloakPhone);
      } else {
        console.warn('[ActiveDelivery] No userId found in order');
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.warn('[ActiveDelivery] Could not fetch customer phone:', error);
    }
  }

  // 2. Action : Le livreur a récupéré le colis
  markAsPickedUp(): void {
    if (!this.delivery) return;
    this.isActionLoading = true;

    this.deliveryService.updateStatus(this.delivery.id, 'PICKED_UP').subscribe({
      next: (updatedDelivery) => {
        // Preserve the customerPhone before replacing the delivery object
        const savedPhone = (this.delivery as any).customerPhone;
        this.delivery = updatedDelivery;
        (this.delivery as any).customerPhone = savedPhone;
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
        this.stopTimer();
        localStorage.removeItem(this.TIMER_STORAGE_KEY);
        this.cdr.detectChanges();
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

  // 5. Timer - Track elapsed time (persists via localStorage)
  private startTimer(): void {
    // Check if we already have a stored start time for this delivery
    const stored = localStorage.getItem(this.TIMER_STORAGE_KEY);
    const storedData = stored ? JSON.parse(stored) : null;

    if (storedData && storedData.deliveryId === this.delivery?.id) {
      // Restore existing timer
      this.timerStartTime = storedData.startTime;
      const now = Date.now();
      this.elapsedSeconds = Math.floor((now - this.timerStartTime) / 1000);
    } else {
      // Start fresh timer
      this.timerStartTime = Date.now();
      this.elapsedSeconds = 0;
      localStorage.setItem(this.TIMER_STORAGE_KEY, JSON.stringify({
        deliveryId: this.delivery?.id,
        startTime: this.timerStartTime
      }));
    }

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.timerStartTime) / 1000);
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  formatElapsed(): string {
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      this.stopTimer();
      localStorage.removeItem(this.TIMER_STORAGE_KEY);
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