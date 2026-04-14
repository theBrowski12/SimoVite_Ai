import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ReviewResponseDto, ReviewRequestDto } from '@models/review.model';
import { ReviewService } from '@services/review.service';
import { OrderService } from '@services/order.service';
import { DeliveryService } from '@services/delivery.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-my-reviews',
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.scss'],
  standalone: false
})
export class Reviews implements OnInit {
  reviews: ReviewResponseDto[] = [];
  isLoading = true;
  targetNames: Record<string, string> = {};
  userOrders: any[] = [];

  // --- Edit Mode State ---
  editingReviewId: string | null = null;
  editRating: number = 0;
  editComment: string = '';
  isUpdating = false;

  constructor(
    private reviewSvc: ReviewService,
    private orderSvc: OrderService,
    private deliverySvc: DeliveryService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.loadMyReviews();
  }

  loadMyReviews(): void {
    this.isLoading = true;

    // First load user orders to match deliveries
    this.orderSvc.getByUserId(this.auth.userId).subscribe({
      next: (orders) => {
        this.userOrders = orders;

        this.reviewSvc.getMyReviews().subscribe({
          next: (data) => {
            this.reviews = data;
            this.isLoading = false;
            this.resolveTargetNames();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading reviews:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        // Still try to load reviews
        this.reviewSvc.getMyReviews().subscribe({
          next: (data) => {
            this.reviews = data;
            this.isLoading = false;
            this.resolveTargetNames();
            this.cdr.detectChanges();
          },
          error: (err2) => {
            console.error('Error loading reviews:', err2);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // Resolve target names - fetch delivery details to get orderRef
  private resolveTargetNames(): void {
    this.reviews.forEach(review => {
      // Check if targetName is meaningful (not just dashes or whitespace)
      const hasValidTargetName = review.targetName &&
        review.targetName.trim() !== '' &&
        !/^[-—–]+$/.test(review.targetName.trim());

      if (hasValidTargetName && typeof review.targetName === 'string') {
        this.targetNames[review.id] = review.targetName;
        return;
      }

      // For DELIVERY reviews, try to find matching order or fetch delivery
      if (review.targetType === 'DELIVERY') {
        // First try to match with cached user orders
        const matchingOrder = this.userOrders.find(o =>
          o.deliveryId === review.targetId ||
          o.id === review.targetId ||
          o.orderRef === review.targetId
        );

        if (matchingOrder) {
          this.targetNames[review.id] = `Order #${matchingOrder.orderRef}`;
        } else {
          // Try to fetch delivery by numeric ID to get orderRef
          const deliveryId = parseInt(review.targetId, 10);
          if (!isNaN(deliveryId) && deliveryId > 0) {
            this.deliverySvc.getById(deliveryId).subscribe({
              next: (delivery) => {
                if (delivery.orderRef) {
                  const parts: string[] = [`Order #${delivery.orderRef}`];
                  if (delivery.courierName) parts.push(delivery.courierName);
                  this.targetNames[review.id] = parts.join(' · ');
                } else {
                  this.targetNames[review.id] = 'Delivery';
                }
                this.cdr.detectChanges();
              },
              error: () => {
                this.targetNames[review.id] = 'Delivery';
                this.cdr.detectChanges();
              }
            });
          } else {
            this.targetNames[review.id] = 'Delivery';
          }
        }
      } else if (review.targetType === 'STORE') {
        this.targetNames[review.id] = review.targetName || 'Store';
      } else if (review.targetType === 'PRODUCT') {
        this.targetNames[review.id] = review.targetName || 'Product';
      } else {
        this.targetNames[review.id] = review.targetName || review.targetType || 'Review';
      }
    });
  }

  getTargetName(review: ReviewResponseDto): string {
    const name = this.targetNames[review.id];
    if (name) return name;
    if (review.targetType === 'DELIVERY') return 'Delivery';
    if (review.targetType === 'STORE') return review.targetName || 'Store';
    if (review.targetType === 'PRODUCT') return review.targetName || 'Product';
    return review.targetType || 'Review';
  }

  // --- EDIT ACTIONS ---

  startEdit(review: ReviewResponseDto): void {
    this.editingReviewId = review.id;
    this.editRating = review.rating;
    this.editComment = review.comment;
    this.cdr.detectChanges(); // Met à jour l'écran

  }

  cancelEdit(): void {
    this.editingReviewId = null;
    this.editRating = 0;
    this.editComment = '';
    this.cdr.detectChanges(); // Met à jour l'écra
  }

  setEditRating(stars: number): void {
    if (!this.isUpdating) {
      this.editRating = stars;
    }
  }

  saveEdit(review: ReviewResponseDto): void {
    if (this.editRating === 0 || !this.editComment.trim()) return;

    this.isUpdating = true;
    
    // We only need to send the fields that can change
    const updatePayload: ReviewRequestDto = {
      targetId: review.targetId,
      targetType: review.targetType,
      rating: this.editRating,
      comment: this.editComment.trim()
    };
    this.reviewSvc.updateReview(review.id, updatePayload).subscribe({
      next: (updatedReview) => {
        // Find the review in our array and replace it with the fresh data from the server
        const index = this.reviews.findIndex(r => r.id === updatedReview.id);
        if (index !== -1) {
          this.reviews[index] = updatedReview;
        }
        this.cancelEdit(); // Close the edit form
        this.isUpdating = false;
        this.cdr.detectChanges(); // Met à jour l'écran

      },
      error: (err: HttpErrorResponse) => {
        console.error('Error updating review:', err);
        if (err.status === 400 && err.error && err.error.message) {
          alert(err.error.message); 
        } else {
          alert("An error occurred while updating your review. Please try again.");
        }
        this.isUpdating = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- DELETE ACTION ---

  deleteReview(id: string): void {
    const isSure = confirm("Are you sure you want to delete this review? This action cannot be undone.");
    if (!isSure) return;

    this.reviewSvc.deleteReview(id).subscribe({
      next: () => {
        // Remove the deleted review from the UI array without reloading the whole page
        this.reviews = this.reviews.filter(r => r.id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting review:', err);
        alert("An error occurred while deleting your review. Please try again.");
        this.cdr.detectChanges();
      }
    });
  }

  // ── Computed properties ──────────────────────────────────

  get averageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / this.reviews.length).toFixed(1));
  }
}