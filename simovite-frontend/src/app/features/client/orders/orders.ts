import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService }  from '../../../services/order.service';
import { AuthService }   from '../../../core/auth/auth.service';
import { Order, OrderStatus, PaymentMethod } from '../../../models/order.model';
import { downloadOrderPdf } from '../../../helpers/downloadOrderPdf';

@Component({
  selector:    'app-orders',
  standalone:  false,
  templateUrl: './orders.html',
  styleUrls:   ['./orders.scss']
})
export class Orders implements OnInit {

  orders:   Order[] = [];
  filtered: Order[] = [];
  loading   = true;
  error     = '';

  // ── Filters ───────────────────────────────────────────────
  filterStatus: OrderStatus | '' = '';
  searchTerm = '';

  // ── Detail panel ─────────────────────────────────────────
  selected: Order | null = null;

  // ── Pagination ────────────────────────────────────────────
  currentPage = 1;
  pageSize    = 8;

  readonly statusOptions: Array<OrderStatus | ''> = ['', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

  constructor(
    private orderSvc: OrderService,
    private auth:     AuthService,
    private router:   Router,
    private cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  // ── Load ──────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    this.error   = '';
    this.orderSvc.getByUserId(this.auth.userId).subscribe({
      next: orders => {
        // Most recent first
        this.orders  = orders.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error   = 'Unable to load your orders. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filters ───────────────────────────────────────────────

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.orders.filter(o => {
      const matchStatus = !this.filterStatus || o.status === this.filterStatus;
      const matchSearch = !term ||
        o.orderRef.toLowerCase().includes(term)  ||
        o.storeName.toLowerCase().includes(term);
      return matchStatus && matchSearch;
    });
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  resetFilters(): void {
    this.filterStatus = '';
    this.searchTerm   = '';
    this.applyFilters();
  }

  // ── Actions ───────────────────────────────────────────────

  trackOrder(order: Order): void {
    this.router.navigate(['/client/track', order.orderRef]);
  }

  confirmPayment(order: Order): void {
    this.orderSvc.confirmPayment(+order.id).subscribe({
      next: updated => {
        Object.assign(order, updated);
        if (this.selected?.id === order.id) this.selected = { ...updated };
      }
    });
  }

  downloadPdf(order: Order): void {
    downloadOrderPdf(order as any);
  }

  reorder(order: Order): void {
    this.router.navigate(['/client/store', order.storeId]);
  }

  // ── Detail ────────────────────────────────────────────────

  openDetail(order: Order): void  { this.selected = order; }
  closeDetail(): void             { this.selected = null; }

  // ── Pagination ────────────────────────────────────────────

  get paginated(): Order[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages():      number[]{ return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pageEnd():    number  { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }

  // ── KPIs ──────────────────────────────────────────────────

  kpiCount(status: OrderStatus): number {
    return this.orders.filter(o => o.status === status).length;
  }

  get totalSpent(): number {
    return this.orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((s, o) => s + o.price, 0);
  }

  // ── Helpers ───────────────────────────────────────────────

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING:   'status-pending',
      ACCEPTED:  'status-accepted',
      COMPLETED: 'status-delivered', // 👈 Remplacé DELIVERED par COMPLETED
      CANCELLED: 'status-cancelled',
      REJECTED:  'status-cancelled'  // 👈 Ajout de REJECTED
    };
    return m[s] ?? '';
  }

  getStatusIcon(s: string): string {
    return { PENDING:'⏳', ACCEPTED:'🔄', COMPLETED:'✅', CANCELLED:'❌', REJECTED:'❌' }[s] ?? '';
  }

  getStatusLabel(s: string): string {
    return { PENDING:'Pending', ACCEPTED:'In Progress', COMPLETED:'Completed', CANCELLED:'Cancelled', REJECTED:'Rejected' }[s] ?? s;
  }

  getPaymentLabel(p: PaymentMethod): string {
    return p === 'CASH_ON_DELIVERY' ? '💵 Cash on Delivery' : '💳 Online Payment';
  }

  getPaymentClass(p: PaymentMethod): string {
    return p === 'CASH_ON_DELIVERY' ? 'pay-cod' : 'pay-online';
  }

  getCategoryClass(c: string): string {
    const m: Record<string,string> = {
      RESTAURANT:'cat-rest', PHARMACY:'cat-pharma',
      SUPERMARKET:'cat-market', SPECIAL_DELIVERY:'cat-special'
    };
    return m[c] ?? '';
  }

  // Progress step index (0–3)
  getProgressStep(status: OrderStatus): number {
    return { PENDING:0, ACCEPTED:1, COMPLETED:3, CANCELLED:-1, REJECTED: -1 }[status] ?? 0;
  }

  canPay(order: Order): boolean {
    return order.paymentMethod === 'ONLINE_PAYMENT' && order.status === 'PENDING';
  }
}
