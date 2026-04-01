import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { OrderService }      from '../../../services/order.service';
import { NotificationService } from '../../../services/notification.service';
import { Order, OrderStatus, DateFilter, PaymentMethod } from '../../../models/order.model';

@Component({
  selector:    'app-admin-orders',
  standalone:  false,
  templateUrl: './orders.html',
  styleUrls:   ['./orders.scss']
})
export class AdminOrders implements OnInit {

  // ── Data ─────────────────────────────────────────────────
  orders:   Order[] = [];
  filtered: Order[] = [];
  loading  = true;
  error    = '';

  // ── Filters ───────────────────────────────────────────────
  searchTerm       = '';
  filterStatus     = '';
  filterPayment    = '';
  filterDate: DateFilter = 'all';

  // ── Pagination ────────────────────────────────────────────
  currentPage = 1;
  pageSize    = 10;

  // ── Detail panel ─────────────────────────────────────────
  selectedOrder: Order | null = null;

  // ── Inline status edit ────────────────────────────────────
  editingStatusId: number | null = null;
  statusOptions: OrderStatus[] = ['PENDING', 'ACCEPTED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private orderSvc: OrderService,
    private notif:    NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  // ── Load ──────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    this.error   = '';
    this.orderSvc.getAll().subscribe({
      next: orders => {
        this.orders  = orders;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error   = 'Failed to load orders.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filters ───────────────────────────────────────────────

  // ── Filters ───────────────────────────────────────────────

  applyFilters(): void {
    // 1. On sécurise le searchTerm au cas où il serait null
    const term = this.searchTerm?.toLowerCase() || '';

    this.filtered = this.orders.filter(o => {

      // 2. On ajoute les fameux "?." pour éviter le crash "Cannot read properties of null"
      const matchSearch =
        !term ||
        o.orderRef?.toLowerCase().includes(term)  ||
        o.fullName?.toLowerCase().includes(term)  ||
        o.storeName?.toLowerCase().includes(term) ||
        o.email?.toLowerCase().includes(term);

      const matchStatus  = !this.filterStatus  || o.status === this.filterStatus;
      const matchPayment = !this.filterPayment || o.paymentMethod === this.filterPayment;
      const matchDate    = this.matchesDateFilter(o.createdAt);

      return matchSearch && matchStatus && matchPayment && matchDate;
    });

    this.currentPage = 1;
  }

  private matchesDateFilter(createdAt: string): boolean {
    if (this.filterDate === 'all') return true;
    const date  = new Date(createdAt);
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.filterDate === 'today') return date >= today;
    if (this.filterDate === 'week') {
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }
    if (this.filterDate === 'month') {
      const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }
    return true;
  }

  reset(): void {
    this.searchTerm    = '';
    this.filterStatus  = '';
    this.filterPayment = '';
    this.filterDate    = 'all';
    this.applyFilters();
  }

  // ── Status update ─────────────────────────────────────────

  startEditStatus(orderId: number): void  { this.editingStatusId = orderId; }
  cancelEditStatus(): void                { this.editingStatusId = null; }

  confirmStatusChange(order: Order, newStatus: OrderStatus): void {
    if (order.status === newStatus) { this.editingStatusId = null; return; }

    const prev = order.status;
    order.status = newStatus;         // optimistic update
    this.editingStatusId = null;

    this.orderSvc.updateStatus(+order.id, newStatus).subscribe({
      next:  updated => {
        Object.assign(order, updated);
        this.notif.success(`Order ${order.orderRef} → ${newStatus}`);
      },
      error: () => {
        order.status = prev;          // rollback
        this.notif.error('Status update failed.');
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────

  deleteOrder(order: Order): void {
    if (!confirm(`Delete order ${order.orderRef}?`)) return;
    this.orderSvc.delete(+order.id).subscribe({
      next:  () => {
        this.orders  = this.orders.filter(o => o.id !== order.id);
        this.applyFilters();
        if (this.selectedOrder?.id === order.id) this.selectedOrder = null;
        this.notif.success(`Order ${order.orderRef} deleted.`);
      },
      error: () => this.notif.error('Delete failed.')
    });
  }

  // ── Confirm payment ───────────────────────────────────────

  confirmPayment(order: Order): void {
    this.orderSvc.confirmPayment(+order.id).subscribe({
      next:  updated => { Object.assign(order, updated); this.notif.success('Payment confirmed ✓'); },
      error: ()      => this.notif.error('Payment confirmation failed.')
    });
  }

  // ── Detail panel ─────────────────────────────────────────

  openDetail(order: Order): void  { this.selectedOrder = order; }
  closeDetail(): void             { this.selectedOrder = null; }

  // ── Pagination ────────────────────────────────────────────

  get paginated(): Order[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages():      number[]{ return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pageEnd():    number  { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }

  // ── KPIs ──────────────────────────────────────────────────

  get totalRevenue(): number {
    return this.orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((s, o) => s + o.price, 0);
  }
  // Revenu généré UNIQUEMENT par la livraison
  get totalDeliveryRevenue(): number {
    return this.orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((s, o) => s + (o.deliveryCost || 0), 0);
  }
  kpiCount(status: OrderStatus): number {
    return this.orders.filter(o => o.status === status).length;
  }

  // ── Style helpers ─────────────────────────────────────────

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING:   'badge-gray',
      ACCEPTED:  'badge-blue',
      DELIVERED: 'badge-green',
      CANCELLED: 'badge-red',
    };
    return m[s] ?? 'badge-gray';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      PENDING: '⏳', ACCEPTED: '🔄', DELIVERED: '✅', CANCELLED: '❌'
    };
    return m[s] ?? '';
  }

  getPaymentClass(p: PaymentMethod): string {
    return p === 'CASH_ON_DELIVERY' ? 'badge-amber' : 'badge-blue';
  }

  getCategoryClass(c: string): string {
    const m: Record<string, string> = {
      RESTAURANT: 'badge-orange', PHARMACY: 'badge-green',
      SUPERMARKET: 'badge-blue',  SPECIAL_DELIVERY: 'badge-purple'
    };
    return m[c] ?? 'badge-gray';
  }
}