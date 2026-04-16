import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { OrderService } from '@services/order.service';
import { StoreService } from '@services/store.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { Order, OrderStatus, PaymentMethod } from '@models/order.model';
import { StoreResponseDto } from '@models/store.model';
import { downloadOrderPdf } from '@helpers/downloadOrderPdf';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss']
})
export class Orders implements OnInit {
  // Data
  stores: StoreResponseDto[] = [];
  selectedStore: StoreResponseDto | null = null;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  error = '';
  successMessage = '';

  // Filters
  searchTerm = '';
  filterStatus: OrderStatus | '' = '';
  filterPayment: PaymentMethod | '' = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Detail modal
  selectedOrder: Order | null = null;
  showDetailModal = false;

  // Status update
  updatingOrderId: String | null = null;

  // Display
  ownerName = '';

  // Status & Payment constants for template
  ORDER_STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
  PAYMENT_METHODS: PaymentMethod[] = ['CASH_ON_DELIVERY', 'ONLINE_PAYMENT'];

  constructor(
    private orderSvc: OrderService,
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
          this.loadOrders();
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
    this.loadOrders();
  }

  loadOrders(): void {
    if (!this.selectedStore) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.orderSvc.getByStoreId(this.selectedStore.id).subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => {
          // Sort by most recent date
          const dateA = new Date(a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt).getTime();
          return dateB - dateA; // Descending: newest first
        });
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch orders:', err);
        this.error = 'Failed to load orders.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filters ──────────────────────────────────────────────

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredOrders = this.orders.filter(o => {
      const matchSearch = !this.searchTerm ||
        o.orderRef.toLowerCase().includes(term) ||
        o.fullName.toLowerCase().includes(term) ||
        o.email.toLowerCase().includes(term);

      const matchStatus = !this.filterStatus || o.status === this.filterStatus;
      const matchPayment = !this.filterPayment || o.paymentMethod === this.filterPayment;

      return matchSearch && matchStatus && matchPayment;
    });

    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterPayment = '';
    this.applyFilters();
  }

  // ── Status Update ────────────────────────────────────────

  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    if (order.status === newStatus) return;

    this.updatingOrderId = order.id;
    const previousStatus = order.status;

    this.orderSvc.updateStatus(+order.id, newStatus).subscribe({
      next: (updated) => {
        Object.assign(order, updated);
        this.successMessage = `Order ${order.orderRef} → ${newStatus}`;
        this.applyFilters();
        this.updatingOrderId = null;
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Status update failed:', err);
        order.status = previousStatus;
        this.error = 'Failed to update order status.';
        this.updatingOrderId = null;
        this.cdr.detectChanges();
      }
    });
  }

  // ── View Details ─────────────────────────────────────────

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }

  // ── Download Receipt ─────────────────────────────────────

  downloadReceipt(order: Order): void {
    downloadOrderPdf(order);
  }

  // ── Helpers ──────────────────────────────────────────────

  getStatusClass(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      PENDING: 'badge-yellow',
      ACCEPTED: 'badge-blue',
      REJECTED: 'badge-red',
      COMPLETED: 'badge-green',
      CANCELLED: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  }

  getStatusIcon(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      PENDING: '⏳',
      ACCEPTED: '✅',
      REJECTED: '❌',
      COMPLETED: '🎉',
      CANCELLED: '🚫'
    };
    return map[status] || '📦';
  }

  getPaymentClass(method: PaymentMethod): string {
    return method === 'CASH_ON_DELIVERY' ? 'badge-orange' : 'badge-blue';
  }

  getPaymentLabel(method: PaymentMethod): string {
    return method === 'CASH_ON_DELIVERY' ? 'COD' : 'Online';
  }

  getItemsCount(order: Order): number {
  // If it's a special delivery, count the package itself as 1 item
  if (order.orderType === 'SPECIAL_DELIVERY') {
    return 1; 
  }

  // Otherwise, safely count the food/pharmacy items
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
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

  getAvailableStatuses(currentStatus: OrderStatus): OrderStatus[] {
    const allStatuses: OrderStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'];

    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      return [currentStatus];
    }

    return allStatuses.filter(s => s !== currentStatus);
  }

  canUpdateStatus(currentStatus: OrderStatus): boolean {
    return currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED';
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.error = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  // ── Pagination ───────────────────────────────────────────

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ── KPI Stats ────────────────────────────────────────────

  get kpiStats() {
    const total = this.orders.length;
    const pending = this.orders.filter(o => o.status === 'PENDING').length;
    const completed = this.orders.filter(o => o.status === 'COMPLETED').length;
    const revenue = this.orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.price, 0);
    const cancelled = this.orders.filter(o => o.status === 'CANCELLED').length;

    return { total, pending, completed, revenue, cancelled };
  }

  getStoreOrderCount(storeId: string): number {
    return this.orders.filter(o => o.storeId === storeId).length;
  }
}

