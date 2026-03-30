import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CatalogService } from '@services/catalog.service';
import { CatalogResponseDto, FoodCategory, PharmacyCategory, SupermarketCategory } from '@models/catalog.model';
import { StoreResponseDto } from '@models/store.model';
import { StoreService } from '@services/store.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-products',
  standalone: false,
  templateUrl: './products.html',
  styleUrls: ['./products.scss']
})
export class AdminProducts implements OnInit {

  // ── Data ──────────────────────────────────────────────────
  products: CatalogResponseDto[] = [];
  filtered: CatalogResponseDto[] = [];
  stores:   StoreResponseDto[]   = [];
  storesMap = new Map<string, StoreResponseDto>();
  loading   = true;

  // ── Filters ───────────────────────────────────────────────
  searchTerm         = '';
  filterMainType     = '';
  filterAvailability = '';
  filterStoreId      = '';           // ← added; was missing in original

  // Sub-category multi-select
  selectedFoodCategories:        string[] = [];
  selectedPharmacyCategories:    string[] = [];
  selectedSupermarketCategories: string[] = [];

  // Enum lists for UI chips
  foodCategoriesList:        string[] = Object.values(FoodCategory);
  pharmacyCategoriesList:    string[] = Object.values(PharmacyCategory);
  supermarketCategoriesList: string[] = Object.values(SupermarketCategory);

  // ── Pagination ────────────────────────────────────────────
  currentPage = 1;
  pageSize    = 10;

  // ── Modal ─────────────────────────────────────────────────
  showModal      = false;
  productToEdit: any = null;

  constructor(
    private catalogService: CatalogService,
    private storeService:   StoreService,
    private cdr:            ChangeDetectorRef,
    private router:         Router
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.loadData();
  }

  // ── Navigation ────────────────────────────────────────────

  goToDetails(id: string): void {
    if (id) this.router.navigate(['/admin/products', id]);
  }

  // ── Data loading ──────────────────────────────────────────

  loadData(): void {
    this.loading = true;
    this.storeService.getAllStores().subscribe({
      next: stores => {
        this.stores = stores;
        stores.forEach(s => this.storesMap.set(s.id, s));
        this.loadProducts();
      },
      error: () => this.loadProducts()
    });
  }

  /**
   * Calls the most targeted API endpoint available,
   * then applies local secondary filters on the result.
   */
  loadProducts(): void {
    this.loading = true;
    this.cdr.detectChanges();

    let request$;

    if (this.searchTerm?.trim()) {
      request$ = this.catalogService.searchOffersByName(this.searchTerm);
    } else if (this.filterMainType) {
      request$ = this.catalogService.getProductsByMainType(this.filterMainType);
    } else {
      request$ = this.catalogService.getAllOffers();
    }

    request$.subscribe(this.handleResponse());
  }

  private handleResponse() {
    return {
      next: (data: CatalogResponseDto[]) => {
        this.products = data ?? [];
        this.applyLocalFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading products', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    };
  }

  /**
   * Local filtering applied on top of the API result.
   * Handles: availability, store, sub-categories.
   */
  applyLocalFilters(): void {
    this.filtered = this.products.filter(p => {
      const prod = p as any;

      // Availability
      const matchAvail =
        !this.filterAvailability ||
        (this.filterAvailability === 'available_api' ? p.available === true : p.available === false);

      // Store
      const matchStore = !this.filterStoreId || p.storeId === this.filterStoreId;

      // Sub-category multi-select
      let matchSub = true;
      if (this.filterMainType === 'RESTAURANT' && this.selectedFoodCategories.length) {
        matchSub = prod.foodCategories?.some((c: string) => this.selectedFoodCategories.includes(c)) ?? false;
      } else if (this.filterMainType === 'PHARMACY' && this.selectedPharmacyCategories.length) {
        matchSub = prod.pharmacyCategories?.some((c: string) => this.selectedPharmacyCategories.includes(c)) ?? false;
      } else if (this.filterMainType === 'SUPERMARKET' && this.selectedSupermarketCategories.length) {
        matchSub = prod.supermarketCategories?.some((c: string) => this.selectedSupermarketCategories.includes(c)) ?? false;
      }

      return matchAvail && matchStore && matchSub;
    });

    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  // ── Filter event handlers ─────────────────────────────────

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onStoreChange(): void {
    this.currentPage = 1;
    this.applyLocalFilters();          // store filter is always local
  }

  onMainTypeChange(): void {
    this.selectedFoodCategories        = [];
    this.selectedPharmacyCategories    = [];
    this.selectedSupermarketCategories = [];
    this.loadProducts();
  }

  toggleCategory(type: 'FOOD' | 'PHARMACY' | 'SUPERMARKET', value: string): void {
    const list =
      type === 'FOOD'      ? this.selectedFoodCategories :
      type === 'PHARMACY'  ? this.selectedPharmacyCategories :
                             this.selectedSupermarketCategories;

    const idx = list.indexOf(value);
    if (idx > -1) list.splice(idx, 1);
    else          list.push(value);

    this.applyLocalFilters();
  }

  reset(): void {
    this.searchTerm                    = '';
    this.filterAvailability            = '';
    this.filterMainType                = '';
    this.filterStoreId                 = '';
    this.selectedFoodCategories        = [];
    this.selectedPharmacyCategories    = [];
    this.selectedSupermarketCategories = [];
    this.loadProducts();
  }

  // ── Product actions ───────────────────────────────────────

  toggle(product: CatalogResponseDto): void {
    const prev = product.available;
    product.available = !prev;

    this.catalogService.toggleAvailability(product.id).subscribe({
      next: () => {},
      error: err => {
        product.available = prev;   // rollback on error
        console.error('Toggle failed', err);
      }
    });
  }

  deleteProduct(product: any): void {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.catalogService.deleteOffer(product.id).subscribe(() => this.loadProducts());
  }

  // ── Modal ─────────────────────────────────────────────────

  openAddModal(): void  { this.productToEdit = null; this.showModal = true; }
  openEditModal(p: CatalogResponseDto): void { this.productToEdit = p; this.showModal = true; }
  closeModal(): void    { this.showModal = false; this.productToEdit = null; }
  onProductSaved(result?: any): void { this.closeModal(); this.loadProducts(); }
  // ── Pagination getters ────────────────────────────────────

  get paginated(): CatalogResponseDto[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages(): number[]    { return Array.from({ length: this.totalPages || 1 }, (_, i) => i + 1); }
  get pageEnd(): number    { return Math.min(this.currentPage * this.pageSize, this.filtered.length); }

  // ── Utility helpers ───────────────────────────────────────

  getStoreName(storeId: string):     string { return this.storesMap.get(storeId)?.name     ?? 'N/A'; }
  getStoreCategory(storeId: string): string { return this.storesMap.get(storeId)?.category ?? ''; }

  getCategoryClass(c?: string): string {
    const m: Record<string, string> = {
      RESTAURANT:       'badge-orange',
      PHARMACY:         'badge-green',
      SUPERMARKET:      'badge-blue',
      SPECIAL_DELIVERY: 'badge-purple'
    };
    return c ? (m[c] ?? 'badge-gray') : 'badge-gray';
  }

  getStars(r = 0): string {
    const n = Math.round(r);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
}
