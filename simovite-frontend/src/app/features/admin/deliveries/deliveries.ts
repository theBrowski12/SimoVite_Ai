import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DeliveryService }    from '../../../services/delivery.service';
import { NotificationService } from '../../../services/notification.service';
import { Delivery, DeliveryStatus, VehicleType } from '../../../models/delivery.model';

@Component({
  selector:    'app-admin-deliveries',
  standalone:  false,
  templateUrl: './deliveries.html',
  styleUrls:   ['./deliveries.scss']
})
export class AdminDeliveries implements OnInit {

  // ── Data ─────────────────────────────────────────────────
  deliveries: Delivery[] = [];
  filtered:   Delivery[] = [];
  loading = true;
  error   = '';

  // ── Filters ───────────────────────────────────────────────
  searchTerm    = '';
  filterStatus  = '';
  filterVehicle = '';
  filterCod     = '';

  // ── Pagination ────────────────────────────────────────────
  currentPage = 1;
  pageSize    = 10;

  // ── Detail panel ─────────────────────────────────────────
  selectedDelivery: Delivery | null = null;

  // ── Inline status edit ────────────────────────────────────
  editingStatusId: number | null = null;
  statusOptions: DeliveryStatus[] = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];

  constructor(
    private deliverySvc: DeliveryService,
    private notif:       NotificationService,
    private cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  // ── Load ──────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    this.error   = '';
    this.deliverySvc.getAll().subscribe({
      next: data => {
        this.deliveries = data.sort((a, b) => {
          // Sort by most recent date
          const dateA = new Date(a.deliveredAt || a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.deliveredAt || b.updatedAt || b.createdAt).getTime();
          return dateB - dateA; // Descending: newest first
        });
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error   = 'Failed to load deliveries.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filters ───────────────────────────────────────────────

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();

    this.filtered = this.deliveries.filter(d => {
      const matchSearch =
        !term ||
        d.orderRef.toLowerCase().includes(term)          ||
        (d.courierName  || '').toLowerCase().includes(term) ||
        (d.customerEmail|| '').toLowerCase().includes(term);

      const matchStatus  = !this.filterStatus  || d.status      === this.filterStatus;
      const matchVehicle = !this.filterVehicle || d.vehicleType === this.filterVehicle;
      const matchCod     =
        !this.filterCod ||
        (this.filterCod === 'cod'  &&  d.cashOnDelivery) ||
        (this.filterCod === 'paid' && !d.cashOnDelivery);

      return matchSearch && matchStatus && matchVehicle && matchCod;
    });

    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  reset(): void {
    this.searchTerm    = '';
    this.filterStatus  = '';
    this.filterVehicle = '';
    this.filterCod     = '';
    this.applyFilters();
  }

  // ── Status update ─────────────────────────────────────────

  startEditStatus(id: number): void  { this.editingStatusId = id;  this.cdr.detectChanges();}
  cancelEditStatus(): void           { this.editingStatusId = null;  this.cdr.detectChanges();}

  confirmStatusChange(delivery: Delivery, newStatus: DeliveryStatus): void {
    if (delivery.status === newStatus) { this.editingStatusId = null;  this.cdr.detectChanges();return; }

    const prev = delivery.status;
    delivery.status      = newStatus;
    this.editingStatusId = null;
    this.cdr.detectChanges();
    this.deliverySvc.updateStatus(delivery.id, newStatus).subscribe({
      next:  updated => {
        Object.assign(delivery, updated);
        this.notif.success(`Delivery ${delivery.orderRef} → ${newStatus}`);
      },
      error: () => {
        delivery.status = prev;
        this.notif.error('Status update failed.');
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────

  deleteDelivery(delivery: Delivery): void {
    if (!confirm(`Delete delivery for ${delivery.orderRef}?`)) return;

    this.deliverySvc.delete(delivery.id).subscribe({
      next: () => {
        this.deliveries = this.deliveries.filter(d => d.id !== delivery.id);
        this.applyFilters();
        if (this.selectedDelivery?.id === delivery.id) this.selectedDelivery = null;
        this.notif.success(`Delivery ${delivery.orderRef} deleted.`);
         this.cdr.detectChanges();
      },
      error: () => this.notif.error('Delete failed.')
    });
  }

  // ── Detail panel ─────────────────────────────────────────

  openDetail(d: Delivery): void  { this.selectedDelivery = d; }
  closeDetail(): void            { this.selectedDelivery = null; }

  // ── KPIs ──────────────────────────────────────────────────

  kpiCount(status: DeliveryStatus): number {
    return this.deliveries.filter(d => d.status === status).length;
  }

  get totalRevenue(): number {
    return this.deliveries
      .filter(d => d.status === 'DELIVERED')
      .reduce((s, d) => s + (d.deliveryCost ?? 0), 0);
  }

  // ── Filter by status (KPI click) ─────────────────────────

  filterByStatus(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  // ── Pagination ────────────────────────────────────────────

  get paginated(): Delivery[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages():      number[]{ return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pageEnd():    number  { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }

  // ── Style helpers ─────────────────────────────────────────

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING:   'badge-gray',
      ASSIGNED:  'badge-orange',
      PICKED_UP: 'badge-blue',
      DELIVERED: 'badge-green',
      CANCELLED: 'badge-red',
    };
    return m[s] ?? 'badge-gray';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      PENDING: '⏳', ASSIGNED: '🛵', PICKED_UP: '📦', DELIVERED: '✅', CANCELLED: '❌'
    };
    return m[s] ?? '';
  }

  getVehicleClass(v: string): string {
    const m: Record<string, string> = {
      MOTORCYCLE: 'badge-orange',
      CAR:        'badge-blue',
      BICYCLE:    'badge-purple',
      TRUCK:      'badge-gray',
    };
    return m[v] ?? 'badge-gray';
  }

  getVehicleIcon(v: string): string {
    const m: Record<string, string> = {
      MOTORCYCLE: '🛵', CAR: '🚗', BICYCLE: '🚲', TRUCK: '🚛'
    };
    return m[v] ?? '';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Delivery time helpers ──────────────────────────────────

  isOnTime(d: Delivery): boolean {
    return !!(d.status === 'DELIVERED' && d.actualDeliveryTimeInMinutes && d.estimatedTimeInMinutes
      && d.actualDeliveryTimeInMinutes <= d.estimatedTimeInMinutes);
  }

  isLate(d: Delivery): boolean {
    return !!(d.status === 'DELIVERED' && d.actualDeliveryTimeInMinutes && d.estimatedTimeInMinutes
      && d.actualDeliveryTimeInMinutes > d.estimatedTimeInMinutes);
  }

  getTimeDiff(d: Delivery): string {
    if (!d.actualDeliveryTimeInMinutes || !d.estimatedTimeInMinutes) return '';
    const diff = d.actualDeliveryTimeInMinutes - d.estimatedTimeInMinutes;
    if (diff === 0) return '';
    return diff > 0 ? `+${diff} min` : `${diff} min`;
  }
}
