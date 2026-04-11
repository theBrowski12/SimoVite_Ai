import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { CatalogService } from '../../../services/catalog.service';
import { StoreService }   from '../../../services/store.service';
import { CatalogResponseDto, FoodCategory, PharmacyCategory, SupermarketCategory } from '../../../models/catalog.model';
import { StoreResponseDto, MainCategory } from '../../../models/store.model';
// ── View modes ────────────────────────────────────────────────────────────────
export type ViewMode    = 'categories' | 'stores' | 'products';
export type SortOption  = 'default' | 'price_asc' | 'price_desc' | 'rating';

// ── Category config ───────────────────────────────────────────────────────────
export interface CategoryConfig {
  key:       MainCategory;
  label:     string;
  icon:      string;
  sub:       string;
  colorClass:string;
  subCats:   string[];
}

@Component({
  selector:    'app-categories',
  standalone:  false,
  templateUrl: './categories.html',
  styleUrls:   ['./categories.scss']
})
export class Categories implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── View state ────────────────────────────────────────────────────────────
  viewMode: ViewMode = 'categories';

  // ── Selected context ──────────────────────────────────────────────────────
  selectedCategory: MainCategory | null = null;
  selectedSubCat    = '';
  selectedStore:    StoreResponseDto | null = null;

  // ── Data ──────────────────────────────────────────────────────────────────
  allStores:    StoreResponseDto[]   = [];
  storesForCat: StoreResponseDto[]   = [];
  products:     CatalogResponseDto[] = [];

  loadingStores   = false;
  loadingProducts = false;

  // ── Search & sort ─────────────────────────────────────────────────────────
  searchCtrl  = new FormControl('');
  searchTerm  = '';
  sort: SortOption = 'default';

  // ── Category definitions ──────────────────────────────────────────────────
  readonly categories: CategoryConfig[] = [
    {
      key:        MainCategory.RESTAURANT,
      label:      'Restaurant',
      icon:       '🍔',
      sub:        'Food and nutrition',
      colorClass: 'food',
      subCats:    Object.values(FoodCategory)
    },
    {
      key:        MainCategory.PHARMACY,
      label:      'Pharmacy',
      icon:       '💊',
      sub:        'Health & Beauty',
      colorClass: 'pharma',
      subCats:    Object.values(PharmacyCategory)
    },
    {
      key:        MainCategory.SUPERMARKET,
      label:      'SuperMarket',
      icon:       '🛒',
      sub:        'Groceries & More',
      colorClass: 'market',
      subCats:    Object.values(SupermarketCategory)
    },
    {
      key:        MainCategory.SPECIAL_DELIVERY,
      label:      'Special',
      icon:       '📦',
      sub:        'Express Delivery',
      colorClass: 'special',
      subCats:    []
    },
  ];

  constructor(
    private catalogSvc: CatalogService,
    private storeSvc:   StoreService,
    private router:     Router,
    private route:      ActivatedRoute,
    private cdr:        ChangeDetectorRef
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Search with debounce
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => { this.searchTerm = term ?? ''; });

    // 👈 NOUVEAU BLOC : Écoute les routes dynamiques (/categories/:categoryName)
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const categoryUrlParam = params.get('categoryName'); 
      
      if (categoryUrlParam) {
        const matchedCategory = this.categories.find(c => 
          c.colorClass.toLowerCase() === categoryUrlParam.toLowerCase() ||
          c.label.toLowerCase() === categoryUrlParam.toLowerCase()
        );

        if (matchedCategory) {
          this.enterCategory(matchedCategory);
        }
      } else {
        // 🟢 C'est ICI que la magie opère pour la Navbar !
        // Si on arrive sur '/categories' tout court, on affiche la liste globale
        this.backToCategories();
      }
    });

    // Read query params (e.g. navigating from home with ?type=RESTAURANT)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['type']) {
        const cat = this.categories.find(c => c.key === params['type']);
        if (cat) this.enterCategory(cat);
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Navigation ────────────────────────────────────────────────────────────

  enterCategory(cat: CategoryConfig): void {
    this.selectedCategory = cat.key;
    this.selectedSubCat   = '';
    this.selectedStore    = null;
    this.viewMode         = 'stores';
    this.products         = []; // 👈 On vide les produits
    this.storesForCat     = []; // 👈 On vide les magasins

    this.cdr.detectChanges(); // 👈 On force l'UI à mettre à jour les onglets tout de suite

    this.loadStoresForCategory(cat.key);
  }

  selectSubCat(sub: string): void {
    if (this.selectedSubCat === sub) {
      // Si on reclique sur le même filtre, on le désactive (retour aux magasins)
      this.selectedSubCat = '';
      this.products = [];
    } else {
      // Sinon, on active le filtre et on charge les produits
      this.selectedSubCat = sub;
      this.products = [];
      this.loadProductsForSubCat(); 
    }
    this.cdr.detectChanges(); // Force la vue à se mettre à jour
  }

  enterStore(store: StoreResponseDto): void {
    // Si ton module client est chargé sous la route principale '/client'
    this.router.navigate(['/stores', store.id]); 
    
    // OU si c'est la racine, utilise : this.router.navigate(['/stores', store.id]);
  }

  backToCategories(): void {
    this.viewMode         = 'categories';
    this.selectedCategory = null;
    this.selectedSubCat   = '';
    this.selectedStore    = null;
    this.storesForCat     = [];
    this.products         = [];
    this.searchCtrl.setValue('');
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private loadStoresForCategory(cat: MainCategory): void {
    this.loadingStores = true;
    this.storeSvc.getStoresByCategory(cat)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  s  => { 
          this.storesForCat = s; 
          this.loadingStores = false; 
          this.cdr.detectChanges(); // 👈 4. Force la mise à jour 
        },
        error: () => { 
          this.loadingStores = false; 
          this.cdr.detectChanges(); // 👈 4. Force la mise à jour 
        }
      });
  }

  loadProductsForSubCat(): void {
    if (!this.selectedSubCat || !this.selectedCategory) return;
    
    this.loadingProducts = true;
    this.cdr.detectChanges(); // Affiche le spinner immédiatement

    let request$;
    switch (this.selectedCategory) {
      case MainCategory.RESTAURANT:
        request$ = this.catalogSvc.getOffersByFoodCategory(this.selectedSubCat);
        break;
      case MainCategory.PHARMACY:
        request$ = this.catalogSvc.getOffersByPharmacyCategory(this.selectedSubCat);
        break;
      case MainCategory.SUPERMARKET:
        request$ = this.catalogSvc.getOffersBySupermarketCategory(this.selectedSubCat);
        break;
      default:
        request$ = this.catalogSvc.getProductsByMainType(this.selectedCategory);
    }

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next:  p  => { 
        this.products = p; 
        this.loadingProducts = false; 
        this.cdr.detectChanges(); // 👈 5. Force l'affichage des produits
      },
      error: () => { 
        this.loadingProducts = false; 
        this.cdr.detectChanges(); 
      }
    });
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get currentCategoryConfig(): CategoryConfig | undefined {
    return this.categories.find(c => c.key === this.selectedCategory);
  }

  get filteredStores(): StoreResponseDto[] {
    const term = this.searchTerm.toLowerCase();
    return this.storesForCat.filter(s =>
      !term ||
      s.name.toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term)
    );
  }

  get filteredProducts(): CatalogResponseDto[] {
    const term = this.searchTerm.toLowerCase();
    let list   = this.products.filter(p => {
      return !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term);
    });

    switch (this.sort) {
      case 'price_asc':  list = [...list].sort((a,b) => a.basePrice - b.basePrice);  break;
      case 'price_desc': list = [...list].sort((a,b) => b.basePrice - a.basePrice);  break;
      case 'rating':     list = [...list].sort((a,b) => (b.rating??0) - (a.rating??0)); break;
    }
    return list;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStoreIcon(cat: MainCategory): string {
    return { RESTAURANT:'🍕', PHARMACY:'💊', SUPERMARKET:'🛒', SPECIAL_DELIVERY:'📦' }[cat] ?? '🏪';
  }

  getStoreBgClass(cat: MainCategory): string {
    return { RESTAURANT:'food-bg', PHARMACY:'pharma-bg', SUPERMARKET:'market-bg', SPECIAL_DELIVERY:'special-bg' }[cat] ?? '';
  }

  getCatBadgeClass(cat: string): string {
    return { RESTAURANT:'badge-rest', PHARMACY:'badge-pharma', SUPERMARKET:'badge-market', SPECIAL_DELIVERY:'badge-special' }[cat] ?? '';
  }

  getStars(r = 0): string {
    return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  }

  getProductCategoryTag(p: CatalogResponseDto): string {
    const prod = p as any;
    return prod.foodCategories?.[0] ?? prod.pharmacyCategories?.[0] ?? prod.supermarketCategories?.[0] ?? '';
  }
}
