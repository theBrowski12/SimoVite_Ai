import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReviewService } from '@services/review.service';
import { StoreService } from '@services/store.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { ReviewResponseDto, ReviewTargetType } from '@models/review.model';
import { StoreResponseDto } from '@models/store.model';

@Component({
  selector: 'app-reviews',
  standalone: false,
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.scss']
})
export class Reviews implements OnInit {
  // Data
  stores: StoreResponseDto[] = [];
  selectedStore: StoreResponseDto | null = null;
  reviews: ReviewResponseDto[] = [];
  filteredReviews: ReviewResponseDto[] = [];
  loading = true;
  error = '';
  successMessage = '';

  // Filters
  searchTerm = '';
  filterSentiment: string = '';
  filterRating: string = '';
  showIncoherentOnly = false;

  // Pagination
  currentPage = 1;
  pageSize = 8;

  // Display
  ownerName = '';

  // Detail modal
  selectedReview: ReviewResponseDto | null = null;
  showDetailModal = false;

  // Sentiment & targetType for template
  ReviewTargetType = ReviewTargetType;

  constructor(
    private reviewSvc: ReviewService,
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
          this.loadReviews();
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
    this.loadReviews();
  }

  loadReviews(): void {
    if (!this.selectedStore) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    // Fetch store reviews
    this.reviewSvc.getReviews(this.selectedStore.id, ReviewTargetType.STORE).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch reviews:', err);
        this.error = 'Failed to load reviews.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filters ──────────────────────────────────────────────

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredReviews = this.reviews.filter(r => {
      const matchSearch = !this.searchTerm ||
        r.clientName.toLowerCase().includes(term) ||
        r.comment.toLowerCase().includes(term) ||
        (r.targetName?.toLowerCase().includes(term));

      const matchSentiment = !this.filterSentiment || r.sentiment === this.filterSentiment;
      const matchRating = !this.filterRating || r.rating === +this.filterRating;
      const matchIncoherent = !this.showIncoherentOnly || r.incoherent;

      return matchSearch && matchSentiment && matchRating && matchIncoherent;
    });

    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterSentiment = '';
    this.filterRating = '';
    this.showIncoherentOnly = false;
    this.applyFilters();
  }

  // ── View Details ─────────────────────────────────────────

  viewDetails(review: ReviewResponseDto): void {
    this.selectedReview = review;
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReview = null;
  }

  // ── Helpers ──────────────────────────────────────────────

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getSentimentClass(sentiment: string): string {
    const map: Record<string, string> = {
      POSITIVE: 'sentiment-positive',
      NEGATIVE: 'sentiment-negative',
      MIXED: 'sentiment-mixed'
    };
    return map[sentiment] || 'sentiment-neutral';
  }

  getSentimentLabel(sentiment: string): string {
    const map: Record<string, string> = {
      POSITIVE: '😊 Positive',
      NEGATIVE: '😞 Negative',
      MIXED: '😐 Mixed'
    };
    return map[sentiment] || 'N/A';
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTargetTypeLabel(type: string): string {
    return type === 'STORE' ? '🏪 Store' : '📦 Product';
  }

  // ── KPI Stats ────────────────────────────────────────────

  get kpiStats() {
    const total = this.reviews.length;
    const avgRating = total > 0 ? this.reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const positive = this.reviews.filter(r => r.sentiment === 'POSITIVE').length;
    const negative = this.reviews.filter(r => r.sentiment === 'NEGATIVE').length;
    const incoherent = this.reviews.filter(r => r.incoherent).length;
    const avgScore = total > 0 ? this.reviews.reduce((s, r) => s + r.sentimentScore, 0) / total : 0;

    return { total, avgRating: Math.round(avgRating * 10) / 10, positive, negative, incoherent, avgScore: Math.round(avgScore * 100) / 100 };
  }

  // ── Pagination ───────────────────────────────────────────

  get paginatedReviews(): ReviewResponseDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReviews.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReviews.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}

