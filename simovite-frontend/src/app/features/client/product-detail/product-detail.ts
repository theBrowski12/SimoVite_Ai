import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogResponseDto } from '@models/catalog.model';
import { CatalogService } from '@services/catalog.service';
import { StoreService } from '@services/store.service';
import { CartService } from '@services/cart.service';
import { ReviewService } from '@services/review.service';
import { NotificationService } from '@services/notification.service';
import { ReviewResponseDto, ReviewTargetType } from '@models/review.model';
import { StoreResponseDto } from '@models/store.model';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail implements OnInit {
  productId!: string;
  product: CatalogResponseDto | null = null;
  store: StoreResponseDto | null = null;
  reviews: ReviewResponseDto[] = [];
  relatedProducts: CatalogResponseDto[] = [];
  loading = true;
  quantity = 1;
  addedToCart = false;

  // Review form
  showReviewForm = false;
  reviewRating = 0;
  reviewHover = 0;
  reviewComment = '';
  submittingReview = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogSvc: CatalogService,
    private storeSvc: StoreService,
    private cartSvc: CartService,
    private reviewSvc: ReviewService,
    private notifSvc: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (this.productId) {
      this.loadProduct();
    }
  }

  loadProduct(): void {
    this.loading = true;
    this.catalogSvc.getOfferById(this.productId).subscribe({
      next: (product) => {
        this.product = product;
        this.loadStore(product.storeId);
        this.loadReviews(product.storeId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStore(storeId: string): void {
    this.storeSvc.getStoreById(storeId).subscribe({
      next: (store) => {
        this.store = store;
        this.loadRelatedProducts(storeId);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadReviews(storeId: string): void {
    this.reviewSvc.getReviews().subscribe({
      next: (allReviews) => {
        this.reviews = allReviews
          .filter(r => r.targetId === storeId)
          .slice(0, 10);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadRelatedProducts(storeId: string): void {
    this.catalogSvc.getOffersByProviderId(storeId).subscribe({
      next: (products) => {
        this.relatedProducts = products
          .filter(p => p.id !== this.productId && p.available)
          .slice(0, 4);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // ── Cart ─────────────────────────────────────────────────
  addToCart(): void {
    if (!this.product) return;
    for (let i = 0; i < this.quantity; i++) {
      this.cartSvc.add(this.product);
    }
    this.addedToCart = true;
    this.notifSvc.success(`${this.product.name} added to cart!`);
    setTimeout(() => this.addedToCart = false, 2000);
  }

  makeSpecialDelivery(): void {
    this.router.navigate(['/special-delivery']);
  }

  // ── Review Form ──────────────────────────────────────────
  submitReview(): void {
    if (this.reviewRating === 0 || !this.reviewComment.trim() || !this.store) return;

    if (this.isGibberish(this.reviewComment)) {
      const proceed = confirm("This comment looks unusual. Are you sure you want to submit it?");
      if (!proceed) return;
    }

    this.submittingReview = true;

    this.reviewSvc.addReview({
      targetId: this.store.id,
      targetType: ReviewTargetType.STORE,
      rating: this.reviewRating,
      comment: this.reviewComment.trim()
    }).subscribe({
      next: (review) => {
        // Trigger notification
        this.notifSvc.notifyNewReview(review.rating);
        this.notifSvc.success('Review submitted successfully! ⭐');

        if (review.incoherent) {
          const isSure = confirm("Our system flagged this as potentially incoherent. Submit anyway?");
          if (!isSure) {
            this.reviewSvc.deleteReview(review.id).subscribe();
            this.submittingReview = false;
            this.cdr.detectChanges();
            return;
          }
        }

        this.reviews = [review, ...this.reviews];
        this.cancelReview();
        this.submittingReview = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to submit review:', err);
        alert('Failed to submit your review. Please try again.');
        this.submittingReview = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelReview(): void {
    this.showReviewForm = false;
    this.reviewRating = 0;
    this.reviewComment = '';
  }

  private isGibberish(text: string): boolean {
    const noSpaces = text.replace(/\s/g, '');
    const entirelyConsonants = /^[bcdfghjklmnpqrstvwxyz]+$/i.test(noSpaces);
    const repeatedChars = /(.)\1{4,}/.test(noSpaces);
    return entirelyConsonants || repeatedChars;
  }

  // ── Helpers ──────────────────────────────────────────────
  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getCategoryTag(): string {
    const p = this.product as any;
    return p.foodCategories?.[0]
      ?? p.pharmacyCategories?.[0]
      ?? p.supermarketCategories?.[0]
      ?? '';
  }

  getOriginalPrice(): number | null {
    if (this.product?.isPromotion && this.product.originalPrice) {
      return this.product.originalPrice;
    }
    return null;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getSentimentClass(sentiment: string): string {
    const m: Record<string, string> = {
      POSITIVE: 'sentiment-positive',
      NEGATIVE: 'sentiment-negative',
      MIXED: 'sentiment-mixed'
    };
    return m[sentiment] || '';
  }

  getSentimentIcon(sentiment: string): string {
    const m: Record<string, string> = {
      POSITIVE: '😊', NEGATIVE: '😞', MIXED: '😐'
    };
    return m[sentiment] || '';
  }

  goBack(): void {
    window.history.back();
  }

  viewProduct(id: string): void {
    this.router.navigate(['/product', id]);
    window.scrollTo(0, 0);
  }

  viewStore(): void {
    if (this.store) {
      this.router.navigate(['/stores', this.store.id]);
    }
  }
}
