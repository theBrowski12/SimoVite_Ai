import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DeliveryService } from '@services/delivery.service';
import { StoreService } from '@services/store.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { Delivery, DeliveryStatus, VehicleType } from '@models/delivery.model';
import { StoreResponseDto } from '@models/store.model';

@Component({
  selector: 'app-deliveries',
  standalone: false,
  templateUrl: './deliveries.html',
  styleUrls: ['./deliveries.scss']
})
export class Deliveries implements OnInit {
  // Data
  stores: StoreResponseDto[] = [];
  selectedStore: StoreResponseDto | null = null;
  deliveries: Delivery[] = [];
  filteredDeliveries: Delivery[] = [];
  loading = true;
  error = '';
  successMessage = '';

  // Filters
  searchTerm = '';
  filterStatus: DeliveryStatus | '' = '';
  filterVehicle: VehicleType | '' = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Detail modal
  selectedDelivery: Delivery | null = null;
  showDetailModal = false;

  // Status update
  updatingDeliveryId: number | null = null;

  // Display
  ownerName = '';

  // Status & Vehicle constants for template
  STATUSES: DeliveryStatus[] = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
  VEHICLES: VehicleType[] = ['BICYCLE', 'MOTORCYCLE', 'CAR', 'TRUCK'];

  constructor(
    private deliverySvc: DeliveryService,
    private storeSvc: StoreService,
    private keycloak: KeycloakService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ownerName = this.keycloak.getFullName();
    this.loadStores();
  }

  // ── Load Data ────────────────────────────────────────────

  loadStores(): void {
    this.loading = true;
    const userId = this.keycloak.getUserId();

    this.storeSvc.getStoresByOwner(userId).subscribe({
      next: (stores) => {
        this.stores = stores;
        if (stores.length > 0 && !this.selectedStore) {
          this.selectedStore = stores[0];
          this.loadDeliveries();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to fetch stores:', err);
        this.error = 'Failed to load your stores.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectStore(store: StoreResponseDto): void {
    this.selectedStore = store;
    this.currentPage = 1;
    this.loading = true;
    this.cdr.detectChanges();
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    if (!this.selectedStore) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.deliverySvc.getByStoreId(this.selectedStore.id).subscribe({
      next: (deliveries) => {
        this.deliveries = deliveries;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch deliveries:', err);
        this.error = 'Failed to load deliveries.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filters ──────────────────────────────────────────────

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredDeliveries = this.deliveries.filter(d => {
      const matchSearch = !this.searchTerm ||
        d.orderRef.toLowerCase().includes(term) ||
        d.courierName?.toLowerCase().includes(term) ||
        d.customerEmail?.toLowerCase().includes(term);

      const matchStatus = !this.filterStatus || d.status === this.filterStatus;
      const matchVehicle = !this.filterVehicle || d.vehicleType === this.filterVehicle;

      return matchSearch && matchStatus && matchVehicle;
    });

    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterVehicle = '';
    this.applyFilters();
  }

  // ── Status Update ────────────────────────────────────────

  updateStatus(delivery: Delivery, newStatus: DeliveryStatus): void {
    if (delivery.status === newStatus) return;

    this.updatingDeliveryId = delivery.id;
    const previousStatus = delivery.status;

    this.deliverySvc.updateStatus(delivery.id, newStatus).subscribe({
      next: (updated) => {
        Object.assign(delivery, updated);
        this.successMessage = `Delivery ${delivery.orderRef} → ${newStatus}`;
        this.applyFilters();
        this.updatingDeliveryId = null;
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Status update failed:', err);
        delivery.status = previousStatus;
        this.error = 'Failed to update delivery status.';
        this.updatingDeliveryId = null;
        this.cdr.detectChanges();
      }
    });
  }

  // ── View Details ─────────────────────────────────────────

  viewDetails(delivery: Delivery): void {
    this.selectedDelivery = delivery;
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedDelivery = null;
  }

  // ── Helpers ──────────────────────────────────────────────

  getStatusClass(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      PENDING: 'badge-yellow',
      ASSIGNED: 'badge-blue',
      PICKED_UP: 'badge-purple',
      DELIVERED: 'badge-green',
      CANCELLED: 'badge-red'
    };
    return map[status] || 'badge-gray';
  }

  getStatusIcon(status: DeliveryStatus): string {
    const map: Record<DeliveryStatus, string> = {
      PENDING: '⏳',
      ASSIGNED: '🏍️',
      PICKED_UP: '📦',
      DELIVERED: '✅',
      CANCELLED: '❌'
    };
    return map[status] || '📦';
  }

  getVehicleIcon(type?: VehicleType): string {
    const map: Record<string, string> = {
      BICYCLE: '🚲',
      MOTORCYCLE: '🏍️',
      CAR: '🚗',
      TRUCK: '🚚'
    };
    return map[type || ''] || '📦';
  }

  getVehicleLabel(type?: VehicleType): string {
    const map: Record<string, string> = {
      BICYCLE: 'Bicycle',
      MOTORCYCLE: 'Motorcycle',
      CAR: 'Car',
      TRUCK: 'Truck'
    };
    return map[type || ''] || 'N/A';
  }

  getVehicleClass(type?: VehicleType): string {
    const map: Record<string, string> = {
      BICYCLE: 'badge-green',
      MOTORCYCLE: 'badge-orange',
      CAR: 'badge-blue',
      TRUCK: 'badge-purple'
    };
    return map[type || ''] || 'badge-gray';
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canUpdateStatus(currentStatus: DeliveryStatus): boolean {
    return currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED';
  }

  getAvailableStatuses(currentStatus: DeliveryStatus): DeliveryStatus[] {
    const all: DeliveryStatus[] = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
    if (currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED') {
      return [currentStatus];
    }
    return all.filter(s => s !== currentStatus);
  }

  // ── KPI Stats ────────────────────────────────────────────

  get kpiStats() {
    const total = this.deliveries.length;
    const pending = this.deliveries.filter(d => d.status === 'PENDING').length;
    const assigned = this.deliveries.filter(d => d.status === 'ASSIGNED').length;
    const delivered = this.deliveries.filter(d => d.status === 'DELIVERED').length;

    return { total, pending, assigned, delivered };
  }

  getStoreDeliveryCount(storeId: string): number {
    // Since we load deliveries by storeId, when this store is selected, all deliveries belong to it
    if (this.selectedStore?.id === storeId) return this.deliveries.length;
    return 0;
  }

  // ── Pagination ───────────────────────────────────────────

  get paginatedDeliveries(): Delivery[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDeliveries.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDeliveries.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.error = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}

