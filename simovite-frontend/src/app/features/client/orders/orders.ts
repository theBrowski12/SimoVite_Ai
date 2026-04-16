import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService }  from '../../../services/order.service';
import { DeliveryService } from '../../../services/delivery.service';
import { ReviewService } from '../../../services/review.service';
import { AuthService }   from '../../../core/auth/auth.service';
import { Order, OrderStatus, PaymentMethod } from '../../../models/order.model';
import { DeliveryStatus } from '../../../models/delivery.model';
import { downloadOrderPdf } from '../../../helpers/downloadOrderPdf';
import { ReviewTargetType } from '@models/review.model';

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

  // ── Review modal ─────────────────────────────────────────
  showReviewModal = false;
  reviewOrderId: string | null = null;
  reviewRating = 0;
  reviewComment = '';
  reviewHoverStar = 0;
  isSubmittingReview = false;
  hasReviewed: Record<string, boolean> = {};

  // ── Pagination ────────────────────────────────────────────
  currentPage = 1;
  pageSize    = 8;

  readonly statusOptions: Array<OrderStatus | ''> = ['', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

  constructor(
    private orderSvc: OrderService,
    private deliverySvc: DeliveryService,
    private reviewSvc: ReviewService,
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
        this.checkReviewedOrders();
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

  // Check which completed orders already have reviews
  private checkReviewedOrders(): void {
    const completedOrders = this.orders.filter(o => o.status === 'COMPLETED');
    if (completedOrders.length === 0) return;

    this.reviewSvc.getMyReviews().subscribe({
      next: reviews => {
        // Mark orders that already have reviews
        reviews.forEach(review => {
          if (review.targetId) {
            this.hasReviewed[review.targetId] = true;
          }
        });
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-critical, just log
        console.warn('Could not fetch reviews');
      }
    });
  }

  // ── Filters ───────────────────────────────────────────────

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    
    this.filtered = this.orders.filter(o => {
      const matchStatus = !this.filterStatus || o.status === this.filterStatus;
      
      // Safely check orderRef and storeName, falling back to empty strings if they are null
      const safeOrderRef = o.orderRef ? o.orderRef.toLowerCase() : '';
      const safeStoreName = o.storeName ? o.storeName.toLowerCase() : '';
      
      const matchSearch = !term || 
        safeOrderRef.includes(term) || 
        safeStoreName.includes(term);
        
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
    this.router.navigate(['/track', order.orderRef]);
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

  canCancel(order: Order): boolean {
    return order.status === 'PENDING';
  }

  cancelOrder(order: Order): void {
    if (!confirm(`Are you sure you want to cancel order ${order.orderRef}?`)) {
      return;
    }

    // First, cancel the order
    this.orderSvc.updateStatus(+order.id, 'CANCELLED').subscribe({
      next: updatedOrder => {
        // Update the order in our local array
        const idx = this.orders.findIndex(o => o.id === order.id);
        if (idx !== -1) {
          this.orders[idx] = updatedOrder;
        }
        // Update filtered view
        this.applyFilters();
        // Update selected if open
        if (this.selected?.id === order.id) {
          this.selected = { ...updatedOrder };
        }

        // Then, cancel the associated delivery
        this.cancelDeliveryForOrder(order.orderRef);

        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to cancel order:', err);
        alert('Failed to cancel order. Please try again.');
      }
    });
  }

  private cancelDeliveryForOrder(orderRef: string): void {
    this.deliverySvc.getByOrderRef(orderRef).subscribe({
      next: delivery => {
        if (delivery && delivery.status !== 'CANCELLED' && delivery.status !== 'DELIVERED') {
          this.deliverySvc.updateStatus(delivery.id, 'CANCELLED').subscribe({
            next: () => {
              console.log(`✅ Delivery ${delivery.id} for order ${orderRef} cancelled`);
            },
            error: err => {
              console.error('Failed to cancel delivery:', err);
            }
          });
        }
      },
      error: err => {
        // Delivery might not exist yet - non-critical error
        console.log('No delivery found for order:', orderRef);
      }
    });
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

  // ── Review methods ────────────────────────────────────────

  canReview(order: Order): boolean {
    return order.status === 'COMPLETED' && !this.hasReviewed[order.id || ''];
  }

  openReviewModal(order: Order): void {
    this.reviewOrderId = order.id || null;
    this.showReviewModal = true;
    this.reviewRating = 0;
    this.reviewComment = '';
    this.reviewHoverStar = 0;
    this.cdr.detectChanges();
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.reviewOrderId = null;
    this.reviewRating = 0;
    this.reviewComment = '';
    this.reviewHoverStar = 0;
    this.cdr.detectChanges();
  }

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
  }

  onStarHover(rating: number): void {
    this.reviewHoverStar = rating;
  }

  onStarLeave(): void {
    this.reviewHoverStar = 0;
  }

  submitReview(): void {
    if (this.reviewRating === 0) {
      alert('Please select a rating');
      return;
    }

    if (!this.reviewOrderId) {
      alert('Unable to submit review: missing order information');
      return;
    }

    this.isSubmittingReview = true;

    const reviewDto = {
      targetId: this.reviewOrderId,
      targetType: ReviewTargetType.DELIVERY as const,
      comment: this.reviewComment,
      rating: this.reviewRating
    };

    this.reviewSvc.addReview(reviewDto).subscribe({
      next: () => {
        this.hasReviewed[this.reviewOrderId!] = true;
        this.closeReviewModal();
        this.cdr.detectChanges();
        alert('Thank you! Your review has been submitted.');
      },
      error: (err) => {
        console.error('Failed to submit review:', err);
        this.isSubmittingReview = false;
        this.cdr.detectChanges();
        alert('Failed to submit review. Please try again.');
      }
    });
  }

  getReviewingOrder(): Order | null {
    if (!this.reviewOrderId) return null;
    return this.orders.find(o => o.id === this.reviewOrderId) || null;
  }
}
