import { ChangeDetectorRef, Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../../services/delivery.service';
import { WebsocketService } from '../../../services/websocket.service';
import { Delivery, DeliveryStatus } from '../../../models/delivery.model';
import { GpsPosition } from '../../../models/Gpsposition.model';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import * as L from 'leaflet';
import { KeycloakService } from '../../../core/auth/keycloak.service';

// Icons
const iconCourier = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconPickup = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconDropoff = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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
  private pollingSubscription: Subscription | null = null;
  private wsSubscription: Subscription | null = null;
  private isMapInitialized = false;

  statusSteps = [
    { key: 'PENDING', label: 'Order Confirmed', icon: 'check_circle', completed: false, active: false },
    { key: 'ASSIGNED', label: 'Courier Assigned', icon: 'person_pin', completed: false, active: false },
    { key: 'PICKED_UP', label: 'Picked Up', icon: 'shopping_bag', completed: false, active: false },
    { key: 'DELIVERED', label: 'Delivered', icon: 'done_all', completed: false, active: false },
  ];

  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService,
    private websocketService: WebsocketService,
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
    // If delivery already loaded, init the map now
    if (this.delivery && !this.isMapInitialized) {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    this.pollingSubscription?.unsubscribe();
    this.wsSubscription?.unsubscribe();
  }

  private loadDelivery(): void {
    this.deliveryService.trackByOrderRef(this.orderRef!).subscribe({
      next: (delivery) => {
        this.delivery = delivery;
        this.updateStatusSteps();
        this.isLoading = false;
        this.cdr.detectChanges();

        if (delivery.courierId) {
          this.startTracking(delivery.courierId);
        }

        // Initialize map after view is updated with delivery data
        this.cdr.detectChanges();
        requestAnimationFrame(() => this.initMap());
      },
      error: (err) => {
        this.error = 'Failed to load delivery details';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

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

    // Force map to recalculate size after container is fully rendered
    requestAnimationFrame(() => {
      this.map.invalidateSize();
    });
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private updateMarkers(): void {
    if (!this.map || !this.delivery) return;

    // Remove existing markers
    if (this.courierMarker) this.map.removeLayer(this.courierMarker);
    if (this.pickupMarker) this.map.removeLayer(this.pickupMarker);
    if (this.dropoffMarker) this.map.removeLayer(this.dropoffMarker);
    if (this.routeLine) this.map.removeLayer(this.routeLine);

    const pathPoints: L.LatLng[] = [];

    // Courier marker
    if (this.courierPosition) {
      this.courierMarker = L.marker(
        [this.courierPosition.latitude, this.courierPosition.longitude],
        { icon: iconCourier }
      )
        .addTo(this.map)
        .bindPopup(`<b>${this.delivery.courierName || 'Courier'}</b><br>📍 Current Position`);
      pathPoints.push(L.latLng(this.courierPosition.latitude, this.courierPosition.longitude));
    }

    // Pickup marker
    if (this.delivery.pickupAddress?.latitude != null && this.delivery.pickupAddress?.longitude != null) {
      const lat = this.delivery.pickupAddress.latitude;
      const lng = this.delivery.pickupAddress.longitude;
      this.pickupMarker = L.marker(
        [lat, lng],
        { icon: iconPickup }
      )
        .addTo(this.map)
        .bindPopup(`<b>🏪 ${this.delivery.pickupAddress.street || 'Pickup'}</b>`);
      pathPoints.push(L.latLng(lat, lng));
    }

    // Dropoff marker
    if (this.delivery.dropoffAddress?.latitude != null && this.delivery.dropoffAddress?.longitude != null) {
      const lat = this.delivery.dropoffAddress.latitude;
      const lng = this.delivery.dropoffAddress.longitude;
      this.dropoffMarker = L.marker(
        [lat, lng],
        { icon: iconDropoff }
      )
        .addTo(this.map)
        .bindPopup(`<b>🏠 ${this.delivery.dropoffAddress.street || 'Delivery'}</b>`);
      pathPoints.push(L.latLng(lat, lng));
    }

    // Route line
    if (pathPoints.length > 1) {
      this.routeLine = L.polyline(pathPoints, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
        lineJoin: 'round'
      }).addTo(this.map);

      const bounds = L.latLngBounds(pathPoints);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  private startTracking(courierId: string): void {
    // Don't track if delivery is already completed or cancelled
    if (this.delivery?.status === 'DELIVERED' || this.delivery?.status === 'CANCELLED') {
      console.log(`[OrderTracking] Delivery ${this.delivery.status} — skipping tracking`);
      return;
    }

    console.log(`[OrderTracking] Starting tracking for courier: ${courierId}`);
    this.startPolling(courierId);
  }

  private startPolling(courierId: string): void {
    this.pollingSubscription = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          // Stop polling if delivery is completed
          if (this.delivery?.status === 'DELIVERED' || this.delivery?.status === 'CANCELLED') {
            console.log(`[OrderTracking] Delivery ${this.delivery?.status} — stopping tracking`);
            this.pollingSubscription?.unsubscribe();
            return of(null);
          }
          return this.deliveryService.getCourierLocation(courierId).pipe(
            catchError((err) => {
              console.warn(`[OrderTracking] Courier location fetch failed:`, err?.message || err);
              return of(null);
            })
          );
        })
      )
      .subscribe({
        next: (loc) => {
          if (loc && loc.latitude != null && loc.longitude != null) {
            console.log(`[OrderTracking] Courier position updated:`, loc);
            this.courierPosition = {
              courierId,
              latitude: loc.latitude,
              longitude: loc.longitude,
              updatedAt: new Date().toISOString()
            };
            this.updateMarkers();
            this.cdr.detectChanges();
          } else {
            console.log(`[OrderTracking] No location available for courier ${courierId}`);
          }
        }
      });
  }

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

  get statusLabel(): string {
    if (!this.delivery) return '';
    const labels: Record<DeliveryStatus, string> = {
      PENDING: 'Preparing your order...',
      ASSIGNED: `${this.delivery.courierName || 'Courier'} is on the way`,
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
      this.map.setView([this.courierPosition.latitude, this.courierPosition.longitude], 16, { animate: true });
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
    const parts = [address.street, address.buildingNumber, address.city].filter(Boolean);
    return parts.join(', ');
  }
}
