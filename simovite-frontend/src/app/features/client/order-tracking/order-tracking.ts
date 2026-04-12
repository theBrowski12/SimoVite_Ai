import { ChangeDetectorRef, Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { NotificationService } from '@services/notification.service';
import { WebsocketService } from '../../../services/websocket.service';
import { Delivery, DeliveryStatus } from '../../../models/delivery.model';
import { GpsPosition } from '../../../models/Gpsposition.model';
import { Subscription, interval, of } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import * as L from 'leaflet';
import { KeycloakService } from '../../../core/auth/keycloak.service';

const iconCourier = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [30, 48], iconAnchor: [15, 48], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconPickup = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [30, 48], iconAnchor: [15, 48], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconDropoff = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [30, 48], iconAnchor: [15, 48], popupAnchor: [1, -34], shadowSize: [41, 41]
});

@Component({
  selector: 'app-order-tracking',
  standalone: false,
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
})
export class OrderTracking implements OnInit, OnDestroy, AfterViewInit {
  delivery: Delivery | null = null;
  courierPosition: GpsPosition | null = null;
  isLoading = true;
  error: string | null = null;
  orderRef: string | null = null;

  private map!: L.Map;
  private courierMarker: L.Marker | null = null;
  private pickupMarker: L.Marker | null = null;
  private dropoffMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;

  // ── Subscriptions ───────────────────────────────────────
  private gpsPollSub: Subscription | null = null;
  private statusPollSub: Subscription | null = null;   // Status REST polling
  private wsStatusSub: Subscription | null = null;     // WS delivery status
  private wsGpsSub: Subscription | null = null;        // WS GPS position

  private isMapInitialized = false;
  private previousStatus: DeliveryStatus | null = null;
  private wsConnected = false;

  statusSteps = [
    { key: 'PENDING',   label: 'Order Confirmed',  icon: 'check_circle', completed: false, active: false },
    { key: 'ASSIGNED',  label: 'Courier Assigned',  icon: 'person_pin',  completed: false, active: false },
    { key: 'PICKED_UP', label: 'Picked Up',         icon: 'shopping_bag', completed: false, active: false },
    { key: 'DELIVERED', label: 'Delivered',         icon: 'done_all',    completed: false, active: false },
  ];

  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService,
    private websocketService: WebsocketService,
    private notifService: NotificationService,
    private keycloakService: KeycloakService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.orderRef = this.route.snapshot.paramMap.get('orderRef');
    if (!this.orderRef) {
      this.error = 'No order reference provided';
      this.isLoading = false;
      return;
    }
    this.loadDelivery();
  }

  ngAfterViewInit(): void {
    if (this.delivery && !this.isMapInitialized) {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    this.gpsPollSub?.unsubscribe();
    this.statusPollSub?.unsubscribe();
    this.wsStatusSub?.unsubscribe();
    this.wsGpsSub?.unsubscribe();
    if (this.wsConnected) {
      this.websocketService.disconnect();
    }
  }

  // ── Initial load ─────────────────────────────────────────

  private loadDelivery(): void {
    this.deliveryService.trackByOrderRef(this.orderRef!).subscribe({
      next: (delivery) => {
        this.delivery = delivery;
        this.previousStatus = delivery.status;
        this.updateStatusSteps();
        this.isLoading = false;
        this.cdr.detectChanges();
        requestAnimationFrame(() => this.initMap());

        const isFinished = delivery.status === 'DELIVERED' || delivery.status === 'CANCELLED';
        if (!isFinished) {
          this.startStatusPolling();
          this.tryConnectWebSocket();
          if (delivery.courierId) {
            this.startGpsPolling(delivery.courierId);
          }
        }
      },
      error: () => {
        this.error = 'Failed to load delivery details';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Status polling (REST fallback) ───────────────────────

  private startStatusPolling(): void {
    this.statusPollSub = interval(5000).pipe(
      startWith(0),
      switchMap(() => {
        const isFinished = this.delivery?.status === 'DELIVERED'
                        || this.delivery?.status === 'CANCELLED';
        if (isFinished) {
          this.statusPollSub?.unsubscribe();
          return of(null);
        }
        return this.deliveryService.trackByOrderRef(this.orderRef!).pipe(
          catchError(err => {
            console.warn('[Tracking] Status poll failed:', err?.message);
            return of(null);
          })
        );
      })
    ).subscribe({
      next: (delivery) => {
        if (!delivery) return;
        this.handleDeliveryUpdate(delivery);
      }
    });
  }

  // ── GPS polling (REST) ────────────────────────────────────

  private startGpsPolling(courierId: string): void {
    this.gpsPollSub = interval(4000).pipe(
      startWith(0),
      switchMap(() => {
        const isFinished = this.delivery?.status === 'DELIVERED'
                        || this.delivery?.status === 'CANCELLED';
        if (isFinished) {
          this.gpsPollSub?.unsubscribe();
          return of(null);
        }
        return this.deliveryService.getCourierLocation(courierId).pipe(
          catchError(err => {
            console.warn('[Tracking] GPS poll failed:', err?.message);
            return of(null);
          })
        );
      })
    ).subscribe({
      next: (loc) => {
        if (!loc?.latitude || !loc?.longitude) return;
        this.courierPosition = {
          courierId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: new Date().toISOString()
        };
        this.updateMarkers();
        this.cdr.detectChanges();
      }
    });
  }

  // ── WebSocket (real-time upgrade) ────────────────────────

  private tryConnectWebSocket(): void {
    try {
      const token = this.keycloakService.getToken();
      this.websocketService.connect(token);
      this.wsConnected = true;

      // Watch delivery status via WS — overrides polling when available
      this.wsStatusSub = this.websocketService
        .watchDelivery(this.orderRef!)
        .subscribe({
          next: (delivery) => {
            console.log('[WS] Delivery status update:', delivery.status);
            this.handleDeliveryUpdate(delivery);
          },
          error: (err) => console.warn('[WS] Status watch error:', err)
        });

      // Watch GPS via WS if courier already assigned
      if (this.delivery?.courierId) {
        this.startWsGps(this.delivery.courierId);
      }

    } catch (err) {
      console.warn('[WS] Connection failed — falling back to polling only:', err);
      this.wsConnected = false;
    }
  }

  private startWsGps(courierId: string): void {
    this.wsGpsSub = this.websocketService
      .watchCourier(courierId)
      .subscribe({
        next: (pos: GpsPosition) => {
          this.courierPosition = pos;
          this.updateMarkers();
          this.cdr.detectChanges();
        },
        error: (err) => console.warn('[WS] GPS watch error:', err)
      });
  }

  // ── Shared delivery update handler ───────────────────────

  private handleDeliveryUpdate(delivery: Delivery): void {
    const oldStatus = this.previousStatus;
    const newStatus = delivery.status;

    if (oldStatus && newStatus !== oldStatus) {
      this.notifyStatusChange(oldStatus, newStatus);

      // Courier just got assigned — start GPS tracking
      if (newStatus === 'ASSIGNED' && delivery.courierId) {
        if (this.wsConnected) {
          this.startWsGps(delivery.courierId);
        } else {
          this.startGpsPolling(delivery.courierId);
        }
      }

      // Delivery finished — stop everything
      if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
        this.gpsPollSub?.unsubscribe();
        this.statusPollSub?.unsubscribe();
        this.wsStatusSub?.unsubscribe();
        this.wsGpsSub?.unsubscribe();
        if (this.wsConnected) {
          this.websocketService.disconnect();
          this.wsConnected = false;
        }
      }
    }

    this.previousStatus = newStatus;
    this.delivery = delivery;
    this.updateStatusSteps();
    this.cdr.detectChanges();
  }

  // ── Map ───────────────────────────────────────────────────

  private initMap(): void {
    if (this.isMapInitialized || !this.delivery) return;
    this.isMapInitialized = true;

    const centerLat = this.delivery.pickupAddress?.latitude || 33.5731;
    const centerLng = this.delivery.pickupAddress?.longitude || -7.5898;

    this.map = L.map('tracking-map').setView([centerLat, centerLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.updateMarkers();
    requestAnimationFrame(() => this.map.invalidateSize());
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private updateMarkers(): void {
    if (!this.map || !this.delivery) return;

    if (this.courierMarker) this.map.removeLayer(this.courierMarker);
    if (this.pickupMarker)  this.map.removeLayer(this.pickupMarker);
    if (this.dropoffMarker) this.map.removeLayer(this.dropoffMarker);
    if (this.routeLine)     this.map.removeLayer(this.routeLine);

    const pathPoints: L.LatLng[] = [];

    if (this.courierPosition) {
      this.courierMarker = L.marker(
        [this.courierPosition.latitude, this.courierPosition.longitude],
        { icon: iconCourier }
      ).addTo(this.map)
       .bindPopup(`<b>${this.delivery.courierName || 'Courier'}</b><br>📍 Current Position`);
      pathPoints.push(L.latLng(this.courierPosition.latitude, this.courierPosition.longitude));
    }

    // ✅ Fix: assign to local const so TS knows they're defined
    const pickupLat = this.delivery.pickupAddress?.latitude;
    const pickupLng = this.delivery.pickupAddress?.longitude;
    if (pickupLat != null && pickupLng != null) {
      this.pickupMarker = L.marker([pickupLat, pickupLng], { icon: iconPickup })
        .addTo(this.map)
        .bindPopup(`<b>🏪 ${this.delivery.pickupAddress?.street || 'Pickup'}</b>`);
      pathPoints.push(L.latLng(pickupLat, pickupLng));
    }

    // ✅ Fix: same pattern for dropoff
    const dropoffLat = this.delivery.dropoffAddress?.latitude;
    const dropoffLng = this.delivery.dropoffAddress?.longitude;
    if (dropoffLat != null && dropoffLng != null) {
      this.dropoffMarker = L.marker([dropoffLat, dropoffLng], { icon: iconDropoff })
        .addTo(this.map)
        .bindPopup(`<b>🏠 ${this.delivery.dropoffAddress?.street || 'Delivery'}</b>`);
      pathPoints.push(L.latLng(dropoffLat, dropoffLng));
    }

    if (pathPoints.length > 1) {
      this.routeLine = L.polyline(pathPoints, {
        color: '#3b82f6', weight: 4, opacity: 0.8,
        dashArray: '10, 10', lineJoin: 'round'
      }).addTo(this.map);
      this.map.fitBounds(L.latLngBounds(pathPoints), { padding: [50, 50] });
    }
  }

  // ── Status steps ──────────────────────────────────────────

  private updateStatusSteps(): void {
    if (!this.delivery) return;
    const statusOrder = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(this.delivery.status);
    this.statusSteps = this.statusSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  }

  private notifyStatusChange(oldStatus: DeliveryStatus, newStatus: DeliveryStatus): void {
    const orderRef = this.delivery?.orderRef || 'your order';

    // ✅ Push notification outside current change detection cycle
    setTimeout(() => {
      if (newStatus === 'ASSIGNED') {
        this.notifService.notifyDeliveryAssigned(orderRef);
        this.notifService.info(`Courier is on the way! 🚚`);
      } else if (newStatus === 'PICKED_UP') {
        this.notifService.success(`Order picked up! Heading to you 📦`);
      } else if (newStatus === 'DELIVERED') {
        this.notifService.notifyDeliveryCompleted(orderRef);
        this.notifService.success(`Order delivered successfully! 🎉`);
      }
    }, 0);
  }

  // ── Template helpers ──────────────────────────────────────

  get statusLabel(): string {
    if (!this.delivery) return '';
    const labels: Record<DeliveryStatus, string> = {
      PENDING:   'Preparing your order...',
      ASSIGNED:  `${this.delivery.courierName || 'Courier'} is on the way`,
      PICKED_UP: 'Order picked up — heading to you!',
      DELIVERED: 'Delivered successfully! 🎉',
      CANCELLED: 'Order cancelled',
    };
    return labels[this.delivery.status] || '';
  }

  get etaDisplay(): string | null {
    if (!this.delivery?.estimatedTimeInMinutes) return null;
    const mins = this.delivery.estimatedTimeInMinutes;
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining > 0 ? remaining + 'min' : ''}`;
  }

  centerOnCourier(): void {
    if (this.courierPosition && this.map) {
      this.map.setView(
        [this.courierPosition.latitude, this.courierPosition.longitude], 16, { animate: true }
      );
    }
  }

  centerOnDestination(): void {
    const lat = this.delivery?.dropoffAddress?.latitude;
    const lng = this.delivery?.dropoffAddress?.longitude;
    if (lat != null && lng != null && this.map) {
      this.map.setView([lat, lng], 16, { animate: true });
    }
  }

  formatAddress(address: any): string {
    if (!address) return '';
    return [address.street, address.buildingNumber, address.city].filter(Boolean).join(', ');
  }
}