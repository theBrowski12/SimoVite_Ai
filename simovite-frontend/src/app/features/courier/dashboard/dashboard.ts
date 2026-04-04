import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DeliveryService } from '../../../services/delivery.service';
import { AuthService }     from '../../../core/auth/auth.service';
import { NotificationService } from '../../../services/notification.service';

import { Delivery, VehicleType, DeliveryStatus } from '../../../models/delivery.model';

@Component({
  selector:    'app-dashboard',
  standalone:  false,
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── Data ──────────────────────────────────────────────────
  pendingDeliveries: Delivery[] = [];
  myDeliveries:      Delivery[] = [];

  loadingPending = true;
  loadingMine    = true;
  acceptingId: number | null = null;   // tracks which card is being accepted

    // Vehicle options for accept modal
  vehicles: VehicleType[] = ['MOTORCYCLE', 'CAR', 'BICYCLE', 'TRUCK'];
  vehicleIcons: Record<VehicleType, string> = {
    MOTORCYCLE: '🛵', CAR: '🚗', BICYCLE: '🚲', TRUCK: '🚛'
  };

  // Accept modal state
  showAcceptModal    = false;
  pendingAccept:     Delivery | null = null;
  selectedVehicle:   VehicleType = 'MOTORCYCLE';

  // ── Stats computed from myDeliveries ─────────────────────
  get totalDeliveries(): number {
    return this.myDeliveries.filter(d => d.status === 'DELIVERED').length;
  }

  get weekEarnings(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.myDeliveries
      .filter(d => d.status === 'DELIVERED' && new Date(d.createdAt) >= oneWeekAgo)
      .reduce((s, d) => s + (d.deliveryCost ?? 0), 0);
  }

  get totalEarnings(): number {
    return this.myDeliveries
      .filter(d => d.status === 'DELIVERED')
      .reduce((s, d) => s + (d.deliveryCost ?? 0), 0);
  }

  get completionRate(): number {
    const total      = this.myDeliveries.length;
    const delivered  = this.myDeliveries.filter(d => d.status === 'DELIVERED').length;
    return total > 0 ? Math.round((delivered / total) * 100) : 0;
  }

  get activeDelivery(): Delivery | undefined {
    return this.myDeliveries.find(d =>
      d.status === 'ASSIGNED' || d.status === 'PICKED_UP'
    );
  }

  // Recent = last 5 delivered
  get recentDeliveries(): Delivery[] {
    return [...this.myDeliveries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }


  constructor(
    public  auth:        AuthService,
    private deliverySvc: DeliveryService,
    private notifSvc:    NotificationService,
    private router:      Router,
    private cdr:        ChangeDetectorRef
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────

  loadAll(): void {
    this.loadPending();
    this.loadMine();
  }

  loadPending(): void {
    this.loadingPending = true;
    this.deliverySvc.getPending()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  d  => { 
          this.pendingDeliveries = d; 
          this.loadingPending = false; 
          this.cdr.detectChanges(); },
        error: () => { 
          this.loadingPending = false;
        this.cdr.detectChanges(); }
      });
  }

  loadMine(): void {
    this.loadingMine = true;
    this.deliverySvc.getMine()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  d  => { this.myDeliveries = d; this.loadingMine = false; this.cdr.detectChanges();},
        error: () => { this.loadingMine = false; this.cdr.detectChanges();}
      });
  }  

  goToActiveDelivery(): void {
    // ⚠️ Adapte le chemin selon ton fichier de routing !
    this.router.navigate(['/courier/active', this.activeDelivery?.id]); 
  }
  // ── Accept flow ───────────────────────────────────────────

  openAcceptModal(delivery: Delivery): void {
    this.pendingAccept   = delivery;
    this.selectedVehicle = 'MOTORCYCLE';
    this.showAcceptModal = true;
    this.cdr.detectChanges();
  }

  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.pendingAccept   = null;
    this.cdr.detectChanges();
  }

  confirmAccept(): void {
    if (!this.pendingAccept || !this.selectedVehicle) return;

    const delivery        = this.pendingAccept;
    this.acceptingId      = delivery.id;
    this.showAcceptModal  = false;

    // Vérifier si le navigateur supporte la géolocalisation
    if (!navigator.geolocation) {
      this.acceptingId = null;
      this.notifSvc.error("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    // Récupérer la position exacte du livreur
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Appel au service avec le type de véhicule ET les coordonnées GPS
        this.deliverySvc.accept(delivery.id, this.selectedVehicle, lat, lng)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: accepted => {
              // Remove from pending list
              this.pendingDeliveries = this.pendingDeliveries.filter(d => d.id !== accepted.id);
              // Add to my deliveries
              this.myDeliveries = [accepted, ...this.myDeliveries];
              this.acceptingId  = null;
              this.notifSvc.success(`Delivery ${accepted.orderRef} accepted! Head to pickup. 🛵`);
              // Navigate to active delivery
              this.router.navigate(['/courier/active', accepted.id]);
            },
            error: () => {
              this.acceptingId = null;
              this.notifSvc.error('Failed to accept delivery. Try again.');
              this.cdr.detectChanges();
            }
          });
      },
      (error) => {
        // Gestion des erreurs si le livreur refuse de partager sa position ou si le signal est perdu
        this.acceptingId = null;
        console.error('Erreur GPS:', error);
        this.notifSvc.error("Impossible de récupérer votre position. Veuillez autoriser l'accès au GPS.");
        this.cdr.detectChanges();
      }
    );
  }

  // Quick accept without modal (uses MOTORCYCLE default)
  quickAccept(delivery: Delivery): void {
    this.openAcceptModal(delivery);
  }

  // ── Navigate to preview (ETA/Price before accepting) ──────

  previewDelivery(delivery: Delivery): void {
    this.router.navigate(['/courier/preview', delivery.id]);
    this.cdr.detectChanges();
  }

  // ── Navigate to active delivery ───────────────────────────

  goToActive(): void {
    if (this.activeDelivery) {
      this.router.navigate(['/courier/active', this.activeDelivery.id]);
    }
  }

  // ── Helpers ───────────────────────────────────────────────

  get initials(): string {
    return this.auth.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'C';
  }

  getStatusClass(status: DeliveryStatus): string {
    const m: Record<DeliveryStatus, string> = {
      PENDING:   'badge-gray',
      ASSIGNED:  'badge-orange',
      PICKED_UP: 'badge-blue',
      DELIVERED: 'badge-green',
      CANCELLED: 'badge-red', 
    };
    return m[status] ?? 'badge-gray';
  }

  getStatusIcon(status: DeliveryStatus): string {
  const icons: Record<string, string> = {
    PENDING: '⏳',
    ASSIGNED: '🛵',
    PICKED_UP: '📦',
    DELIVERED: '✅',
    CANCELLED: '❌' // 🌟 Ajout de la clé manquante
  };
  
  return icons[status] ?? '';
}

  formatDate(d: string): string {
    const date  = new Date(d);
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yest  = new Date(today); yest.setDate(yest.getDate() - 1);

    if (date >= today) return 'Today';
    if (date >= yest)  return 'Yesterday';
    return date.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' });
  }
}
