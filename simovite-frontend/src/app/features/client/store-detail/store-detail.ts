import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { Location } from '@angular/common';
import { StoreService } from '@services/store.service';
import { CatalogService } from '@services/catalog.service';
import { ReviewService } from '@services/review.service';

import { StoreResponseDto, MainCategory } from '@models/store.model';
import { CatalogResponseDto, FoodCategory, PharmacyCategory, SupermarketCategory } from '@models/catalog.model';
import { ReviewResponseDto, ReviewTargetType } from '@models/review.model';

// ── Cart item (local, before moving to NgRx) ─────────────────────────────────
export interface CartItem {
  product:  CatalogResponseDto;
  quantity: number;
}

@Component({
  selector:    'app-store-detail',
  standalone:  false,
  templateUrl: './store-detail.html',
  styleUrls:   ['./store-detail.scss']
})
export class StoreDetailComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── Store & products ──────────────────────────────────────────────────────
  store:    StoreResponseDto | null = null;
  products: CatalogResponseDto[]   = [];
  reviews:  ReviewResponseDto[]               = [];

  loadingStore    = true;
  loadingProducts = true;
  loadingReviews  = true;
  error = '';

  // ── Category filter ───────────────────────────────────────────────────────
  selectedCategory = '';
  searchTerm       = '';

  foodCategories:        string[] = Object.values(FoodCategory);
  pharmacyCategories:    string[] = Object.values(PharmacyCategory);
  supermarketCategories: string[] = Object.values(SupermarketCategory);

  // ── Cart ──────────────────────────────────────────────────────────────────
  cart: CartItem[] = [];
  showCart = false;

  // ── Review form ───────────────────────────────────────────────────────────
  showReviewForm  = false;
  reviewRating    = 0;
  reviewHover     = 0;
  reviewComment   = '';
  submittingReview = false;

  constructor(
    private route:       ActivatedRoute,
    private router:      Router,
    private storeSvc:    StoreService,
    private catalogSvc:  CatalogService,
    private reviewSvc:   ReviewService,
    private cdr:         ChangeDetectorRef,
    private location: Location,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params.get('id')!;
        this.resetState();
        return this.storeSvc.getStoreById(id);
      })
    ).subscribe({
      next:  store  => { this.store = store; this.loadingStore = false; this.loadProducts(); this.loadReviews(); },
      error: ()     => { this.error = 'Store not found.'; this.loadingStore = false; }
    });
  }
  
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private resetState(): void {
    this.store = null; this.products = []; this.reviews = [];
    this.loadingStore = true; this.loadingProducts = true; this.loadingReviews = true;
    this.selectedCategory = ''; this.searchTerm = ''; this.error = '';
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadProducts(): void {
    if (!this.store) return;
    this.loadingProducts = true;
    this.catalogSvc.getOffersByProviderId(this.store.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  p  => { this.products = p; this.loadingProducts = false; },
        error: () => { this.loadingProducts = false; }
      });
  }

  loadReviews(): void {
    if (!this.store) return; // Sécurité supplémentaire
    
    this.loadingReviews = true;
    
    this.reviewSvc.getReviews().subscribe({
      next: (data) => {
        // 🌟 CORRECTION 1 : On filtre les avis pour ne garder que ceux de ce magasin
        this.reviews = data.filter(r => r.targetId === this.store!.id);
        
        this.loadingReviews = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des avis:', err);
        this.loadingReviews = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filtered products ─────────────────────────────────────────────────────

  get filteredProducts(): CatalogResponseDto[] {
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(p => {
      const prod = p as any;

      const matchSearch = !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term);

      const matchCat = !this.selectedCategory || (
        prod.foodCategories?.includes(this.selectedCategory)        ||
        prod.pharmacyCategories?.includes(this.selectedCategory)    ||
        prod.supermarketCategories?.includes(this.selectedCategory)
      );

      return matchSearch && matchCat;
    });
  }

  get availableCategories(): string[] {
    switch (this.store?.category) {
      case MainCategory.RESTAURANT:        return this.foodCategories;
      case MainCategory.PHARMACY:          return this.pharmacyCategories;
      case MainCategory.SUPERMARKET:       return this.supermarketCategories;
      default:                             return [];
    }
  }

  selectCategory(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
  }

  // ── Cart ──────────────────────────────────────────────────────────────────

  addToCart(product: CatalogResponseDto): void {
    if (!product.available) return;
    const existing = this.cart.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({ product, quantity: 1 });
    }
  }

  removeFromCart(productId: string): void {
    this.cart = this.cart.filter(i => i.product.id !== productId);
  }

  updateQty(productId: string, delta: number): void {
    const item = this.cart.find(i => i.product.id === productId);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
  }

  getCartQty(productId: string): number {
    return this.cart.find(i => i.product.id === productId)?.quantity ?? 0;
  }

  isInCart(productId: string): boolean {
    return this.cart.some(i => i.product.id === productId);
  }

  get cartTotal(): number {
    return this.cart.reduce((s, i) => s + i.product.basePrice * i.quantity, 0);
  }

  get cartCount(): number {
    return this.cart.reduce((s, i) => s + i.quantity, 0);
  }

  goToCheckout(): void {
    // Pass cart via router state or service/store before navigating
    this.router.navigate(['/client/checkout'], { state: { cart: this.cart, store: this.store } });
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  get avgRating(): number {
    if (!this.reviews.length) return 0;
    return +(this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length).toFixed(1);
  }

  getRatingBar(star: number): number {
    if (!this.reviews.length) return 0;
    return Math.round(this.reviews.filter(r => Math.round(r.rating) === star).length / this.reviews.length * 100);
  }

  getSentimentClass(s?: string): string {
    const m: Record<string, string> = {
      POSITIVE: 'badge-sentiment-pos',
      NEGATIVE: 'badge-sentiment-neg',
      MIXED:    'badge-sentiment-mix',
    };
    return s ? (m[s] ?? '') : '';
  }

  getSentimentIcon(s?: string): string {
    return { POSITIVE: '😊', NEGATIVE: '😞', MIXED: '😐' }[s ?? ''] ?? '';
  }

  getStars(r: number): string {
    return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  submitReview(): void {
    if (this.reviewRating === 0 || !this.reviewComment.trim() || !this.store) return;

    // 🌟 1. Vérification Front-end (Optionnel)
    if (this.isGibberish(this.reviewComment)) {
      const proceed = confirm("Are you sure about this comment? It looks a bit unusual.");
      if (!proceed) return;
    }

    this.submittingReview = true;

    this.reviewSvc.addReview({
      targetId:   this.store.id,
      targetType: ReviewTargetType.STORE,
      rating:     this.reviewRating,
      comment:    this.reviewComment.trim(),
    }).subscribe({
      next: review => {
        
        // 🌟 2. Vérification Back-end
        if (review.incoherent) {
          const isSure = confirm("Our system flagged this comment as potentially incoherent. Are you sure you want to keep it?");
          
          if (!isSure) {
            // L'utilisateur annule : On demande au serveur de supprimer l'avis qui vient d'être créé
            this.reviewSvc.deleteReview(review.id).subscribe({
              next: () => {
                // Suppression réussie, on débloque le bouton
                this.submittingReview = false;
                this.cdr.detectChanges();
              },
              error: (err) => {
                // Même si la suppression échoue, il faut débloquer l'UI
                console.error('Erreur lors de la suppression de l\'avis annulé:', err);
                this.submittingReview = false;
                this.cdr.detectChanges();
              }
            });
            
            return; // On arrête la fonction ici, l'avis ne sera pas ajouté à la liste affichée
          }
        }

        // Succès : on ajoute l'avis à l'interface et on ferme le formulaire
        this.reviews = [review, ...this.reviews];
        this.showReviewForm  = false;
        this.reviewRating    = 0;
        this.reviewComment   = '';
        this.submittingReview = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la soumission de l\'avis:', err);
        alert("Une erreur s'est produite lors de l'envoi de votre avis. Veuillez réessayer.");
        this.submittingReview = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 Helper method to catch keyboard mashing (e.g., "jjjjjjjj" or "asdfasdf")
  private isGibberish(text: string): boolean {
    const noSpaces = text.replace(/\s/g, '');
    
    // Check 1: Is it entirely made of consonants? (e.g., "ghjkl")
    const entirelyConsonants = /^[bcdfghjklmnpqrstvwxyz]+$/i.test(noSpaces);
    
    // Check 2: Does it have 5 or more of the exact same letter in a row? (e.g., "wooooow")
    const repeatedChars = /(.)\1{4,}/.test(noSpaces);

    return entirelyConsonants || repeatedChars;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getCategoryLabel(): string {
    const m: Record<string, string> = {
      RESTAURANT:       '🍕 Restaurant',
      PHARMACY:         '💊 Pharmacy',
      SUPERMARKET:      '🛒 Supermarket',
      SPECIAL_DELIVERY: '📦 Special Delivery',
    };
    return m[this.store?.category ?? ''] ?? '';
  }

  getCategoryClass(): string {
    const m: Record<string, string> = {
      RESTAURANT:       'cat-rest',
      PHARMACY:         'cat-pharma',
      SUPERMARKET:      'cat-market',
      SPECIAL_DELIVERY: 'cat-special',
    };
    return m[this.store?.category ?? ''] ?? '';
  }

  getProductCategoryTag(p: CatalogResponseDto): string {
    const prod = p as any;
    return prod.foodCategories?.[0]
      ?? prod.pharmacyCategories?.[0]
      ?? prod.supermarketCategories?.[0]
      ?? '';
  }

  goBack(): void { this.router.navigate(['/client/categories']); }
}
