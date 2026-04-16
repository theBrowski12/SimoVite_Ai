import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoreService } from '@services/store.service';
import { StoreResponseDto, MainCategory } from '@models/store.model';
import { ReviewService } from '@services/review.service';
import { ReviewResponseDto } from '@models/review.model';
import { CatalogService } from '@services/catalog.service';
import { CatalogResponseDto } from '@models/catalog.model';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  // On transforme l'Enum en tableau pour l'affichage
  categories: any[] = [];
  stores: StoreResponseDto[] = [];
  reviews: ReviewResponseDto[] = [];
  hotDeals: CatalogResponseDto[] = [];
  loading = true;
  loadingReviews = true;
  loadingDeals = true;

  // Mapping des icônes basé sur les valeurs de l'Enum
  categoryIcons: Record<string, string> = {
    [MainCategory.RESTAURANT]: '🍔',
    [MainCategory.SUPERMARKET]: '🛒',
    [MainCategory.PHARMACY]: '💊',
    [MainCategory.SPECIAL_DELIVERY]: '📦'
  };

  // Libellés lisibles pour l'UI
  categoryLabels: Record<string, string> = {
    [MainCategory.RESTAURANT]: 'Restaurants',
    [MainCategory.SUPERMARKET]: 'Épicerie',
    [MainCategory.PHARMACY]: 'Pharmacie',
    [MainCategory.SPECIAL_DELIVERY]: 'Coursier'
  };
  // Tracking input
  trackOrderRef = '';

protected readonly Math = Math;
constructor(
  private storeService: StoreService,
  private cdr: ChangeDetectorRef,
  private reviewSvc: ReviewService,
  private catalogSvc: CatalogService,
  private router: Router
) {}

  ngOnInit(): void {
    this.initCategories();
    this.loadStores();
    this.loadReviews();
    this.loadHotDeals();
  }

  private initCategories(): void {
    // Transforme l'Enum en liste d'objets pour le HTML
    this.categories = Object.values(MainCategory).map(value => ({
      id: value,
      name: this.categoryLabels[value] || value,
      icon: this.categoryIcons[value] || '📦'
    }));
  }

  loadStores(): void {
    this.loading = true;
    this.storeService.getAllStores().subscribe({
      next: (storeList) => {
        this.stores = storeList;
        this.loading = false;
        this.cdr.detectChanges();
        // Load reviews to calculate ratings
        this.loadReviews();
      },
      error: (err) => {
        console.error("Erreur chargement magasins:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStoreImage(imagePath: string): string {
    return imagePath ? imagePath : 'assets/images/default-store.jpg';
  }

  loadReviews(): void {
    this.loadingReviews = true;
    this.reviewSvc.getReviews().subscribe({
      next: (allReviews) => {
        // Filter to only store reviews
        const storeReviews = allReviews.filter(r => r.targetType === 'STORE');

        // Calculate ratings for each store
        this.stores.forEach(store => {
          const reviewsForStore = storeReviews.filter(r => r.targetId === store.id);
          store.reviewCount = reviewsForStore.length;
          if (reviewsForStore.length > 0) {
            store.rating = +(reviewsForStore.reduce((sum, r) => sum + r.rating, 0) / reviewsForStore.length).toFixed(1);
          } else {
            store.rating = 0;
          }
        });

        // Get the most recent reviews for display
        this.reviews = storeReviews.slice(0, 6);
        this.loadingReviews = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement des avis:', err);
        this.loadingReviews = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadHotDeals(): void {
    this.loadingDeals = true;
    this.catalogSvc.getAllOffers().subscribe({
      next: (offers) => {
        // Filter to only RESTAURANT and SUPERMARKET products with active promotions
        const promotedOffers = offers.filter(offer => 
          offer.isPromotion && 
          (offer.type === 'RESTAURANT' || offer.type === 'SUPERMARKET')
        );
        
        // Calculate percentage from originalPrice and basePrice if percentage is 0 or undefined
        this.hotDeals = promotedOffers.slice(0, 8).map(deal => ({
          ...deal,
          percentage: deal.percentage && deal.percentage > 0 
            ? deal.percentage 
            : deal.originalPrice && deal.basePrice
              ? Math.round(((deal.originalPrice - deal.basePrice) / deal.originalPrice) * 100)
              : 0
        }));
        
        this.loadingDeals = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement des offres:', err);
        this.loadingDeals = false;
        this.cdr.detectChanges();
      }
    });
  }

  navigateToStore(productId: string): void {
    const product = this.hotDeals.find(d => d.id === productId);
    if (product && product.storeId) {
      this.router.navigate(['/stores', product.storeId]);
    }
  }

  getReviewInitials(clientName: string): string {
    return clientName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  getAvatarColor(clientName: string): string {
    const colors = ['#FF6B35', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
    const index = clientName.length % colors.length;
    return colors[index];
  }

  trackOrder(): void {
    if (this.trackOrderRef && this.trackOrderRef.trim()) {
      this.router.navigate(['/track', this.trackOrderRef.trim()]);
    }
  }
}