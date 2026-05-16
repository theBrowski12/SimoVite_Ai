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
export type SortOption  = 'default' | 'price_asc' | 'price_desc' | 'rating' | 'category';

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
  showStores = false; // Toggle between stores and products

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

  // ── Search & sort & filters ───────────────────────────────────────────────
  searchCtrl  = new FormControl('');
  searchTerm  = '';
  sort: SortOption = 'default';
  
  minPrice: number | null = null;
  maxPrice: number | null = null;
  showOnlyAvailable = false;
  typeFilter: string = 'ALL';

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
    this.products         = []; 
    this.storesForCat     = []; 
    this.showStores       = false; // Default to showing products

    this.cdr.detectChanges(); 

    this.loadStoresForCategory(cat.key);
    this.loadProducts(); // Load all products for this category
  }

  selectSubCat(sub: string): void {
    if (this.selectedSubCat === sub) {
      this.selectedSubCat = '';
    } else {
      this.selectedSubCat = sub;
    }
    this.loadProducts(); 
    this.cdr.detectChanges(); 
  }

  enterStore(store: StoreResponseDto): void {
    this.router.navigate(['/stores', store.id]); 
  }

  backToCategories(): void {
    this.viewMode         = 'categories';
    this.selectedCategory = null;
    this.selectedSubCat   = '';
    this.selectedStore    = null;
    this.storesForCat     = [];
    this.products         = [];
    this.searchCtrl.setValue('');
    this.loadProducts(); // Load all products globally
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
          this.cdr.detectChanges(); 
        },
        error: () => { 
          this.loadingStores = false; 
          this.cdr.detectChanges(); 
        }
      });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.cdr.detectChanges(); 

    let request$;
    
    if (!this.selectedCategory) {
      // Global products load
      request$ = this.catalogSvc.getAllOffers();
    } else if (!this.selectedSubCat) {
      // Products for main category
      request$ = this.catalogSvc.getProductsByMainType(this.selectedCategory);
    } else {
      // Products for sub-category
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
    }

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next:  p  => { 
        this.products = p; 
        this.loadingProducts = false; 
        this.cdr.detectChanges(); 
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
      const matchSearch = !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term);
      const matchMinPrice = this.minPrice === null || p.basePrice >= this.minPrice;
      const matchMaxPrice = this.maxPrice === null || p.basePrice <= this.maxPrice;
      const matchAvailable = !this.showOnlyAvailable || p.available;
      const matchType = this.typeFilter === 'ALL' || p.type === this.typeFilter;
      
      return matchSearch && matchMinPrice && matchMaxPrice && matchAvailable && matchType;
    });

    switch (this.sort) {
      case 'price_asc':  list = [...list].sort((a,b) => a.basePrice - b.basePrice);  break;
      case 'price_desc': list = [...list].sort((a,b) => b.basePrice - a.basePrice);  break;
      case 'rating':     list = [...list].sort((a,b) => (b.rating??0) - (a.rating??0)); break;
      case 'category':   list = [...list].sort((a,b) => String(a.type).localeCompare(String(b.type))); break;
    }
    return list;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStoreIcon(cat: any): string {
    const key = String(cat);
    const icons: any = { RESTAURANT:'🍕', PHARMACY:'💊', SUPERMARKET:'🛒', SPECIAL_DELIVERY:'📦' };
    return icons[key] ?? '🏪';
  }

  getStoreBgClass(cat: any): string {
    const key = String(cat);
    const bgs: any = { RESTAURANT:'food-bg', PHARMACY:'pharma-bg', SUPERMARKET:'market-bg', SPECIAL_DELIVERY:'special-bg' };
    return bgs[key] ?? '';
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