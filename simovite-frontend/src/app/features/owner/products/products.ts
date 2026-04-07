import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CatalogService } from '@services/catalog.service';
import { StoreService } from '@services/store.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import {
  CatalogResponseDto,
  CatalogRequestDto,
  FoodCategory,
  PharmacyCategory,
  SupermarketCategory,
  MainCategory
} from '@models/catalog.model';
import { VehicleType } from '@models/delivery.model';
import { StoreResponseDto } from '@models/store.model';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.html',
  styleUrls: ['./products.scss']
})
export class Products implements OnInit {
  // Data
  stores: StoreResponseDto[] = [];
  selectedStore: StoreResponseDto | null = null;
  products: CatalogResponseDto[] = [];
  filteredProducts: CatalogResponseDto[] = [];
  loading = true;
  error = '';
  successMessage = '';

  // Form
  productForm!: FormGroup;
  promotionForm!: FormGroup;
  showCreateModal = false;
  showEditModal = false;
  showPromotionModal = false;
  submitting = false;
  isEditing = false;
  editingProductId: string | null = null;
  promoProductId: string | null = null;

  // Filters
  searchTerm = '';
  filterAvailability = '';
  filterPromotion = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Display
  ownerName = '';
  selectedProduct: CatalogResponseDto | null = null;
  showDetailModal = false;

  // Category enums for template
  FoodCategory = FoodCategory;
  PharmacyCategory = PharmacyCategory;
  SupermarketCategory = SupermarketCategory;
  MainCategory = MainCategory;
  VehicleTypes : VehicleType[]= ['BICYCLE', 'MOTORCYCLE', 'CAR', 'TRUCK'];

  constructor(
    private catalogSvc: CatalogService,
    private storeSvc: StoreService,
    private keycloak: KeycloakService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
    this.initPromotionForm();
  }

  ngOnInit(): void {
    this.ownerName = this.keycloak.getFullName();
    this.loadStores();
  }

  // ── Form Initialization ──────────────────────────────────

  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      available: [true],
      imageURL: ['', Validators.pattern(/^https?:\/\/.+/)],
      // Restaurant
      vegetarian: [false],
      foodCategories: [[]],
      ingredients: [''],
      allergens: [''],
      // Pharmacy
      requiresPrescription: [false],
      dosage: [''],
      activeIngredient: [''],
      pharmacyCategories: [[]],
      // Supermarket
      weightInKg: [0, Validators.min(0)],
      supermarketCategories: [[]],
      // Special Delivery
      pricePerKm: [0, Validators.min(0)],
      pricePerKg: [0, Validators.min(0)],
      requiredVehicleType: ['']
    });
  }

  private initPromotionForm(): void {
    this.promotionForm = this.fb.group({
      percentage: [10, [Validators.required, Validators.min(1), Validators.max(90)]]
    });
  }

  resetForm(): void {
    this.productForm.reset({
      name: '', description: '', basePrice: 0, available: true, imageURL: '',
      vegetarian: false, foodCategories: [], ingredients: '', allergens: '',
      requiresPrescription: false, dosage: '', activeIngredient: '', pharmacyCategories: [],
      weightInKg: 0, supermarketCategories: [],
      pricePerKm: 0, pricePerKg: 0, requiredVehicleType: ''
    });
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
          this.loadProducts();
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
    this.loadProducts();
  }

  loadProducts(): void {
    if (!this.selectedStore) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.catalogSvc.getOffersByProviderId(this.selectedStore.id).subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch products:', err);
        this.error = 'Failed to load products.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filters ──────────────────────────────────────────────

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();

    this.filteredProducts = this.products.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term);

      const matchAvail = !this.filterAvailability ||
        (this.filterAvailability === 'available' ? p.available : !p.available);

      const matchPromo = !this.filterPromotion ||
        (this.filterPromotion === 'promo' ? p.isPromotion : !p.isPromotion);

      return matchSearch && matchAvail && matchPromo;
    });

    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterAvailability = '';
    this.filterPromotion = '';
    this.applyFilters();
  }

  // ── CRUD ─────────────────────────────────────────────────

  openCreateModal(): void {
    if (!this.selectedStore) {
      this.error = 'Please select a store first.';
      this.cdr.detectChanges();
      return;
    }
    this.isEditing = false;
    this.resetForm();
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetForm();
  }

  submitCreate(): void {
    if (this.productForm.invalid || !this.selectedStore) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const fv = this.productForm.value;
    const base: CatalogRequestDto = {
      name: fv.name, description: fv.description, basePrice: fv.basePrice,
      available: fv.available, storeId: this.selectedStore.id,
      imageURL: fv.imageURL, type: this.selectedStore.category
    };

    const cat = this.selectedStore.category;
    if (cat === 'RESTAURANT') {
      this.catalogSvc.createRestaurantItem({
        ...base, foodCategories: fv.foodCategories || [],
        availableExtras: (fv.availableExtras || '').split(',').filter((s: string) => s.trim()),
        ingredients: (fv.ingredients || '').split(',').filter((s: string) => s.trim()),
        vegetarian: fv.vegetarian, allergens: fv.allergens || ''
      }).subscribe({ next: p => this.handleCreateSuccess(p), error: e => this.handleCreateError(e) });
    } else if (cat === 'PHARMACY') {
      this.catalogSvc.createPharmacyItem({
        ...base, requiresPrescription: fv.requiresPrescription, dosage: fv.dosage,
        activeIngredient: fv.activeIngredient, pharmacyCategories: fv.pharmacyCategories || []
      }).subscribe({ next: p => this.handleCreateSuccess(p), error: e => this.handleCreateError(e) });
    } else if (cat === 'SUPERMARKET') {
      this.catalogSvc.createSupermarketItem({
        ...base, weightInKg: fv.weightInKg, supermarketCategories: fv.supermarketCategories || []
      }).subscribe({ next: p => this.handleCreateSuccess(p), error: e => this.handleCreateError(e) });
    } else if (cat === 'SPECIAL_DELIVERY') {
      this.catalogSvc.createDeliveryService({
        ...base, pricePerKm: fv.pricePerKm, pricePerKg: fv.pricePerKg,
        requiredVehicleType: fv.requiredVehicleType
      }).subscribe({ next: p => this.handleCreateSuccess(p), error: e => this.handleCreateError(e) });
    } else {
      this.catalogSvc.createOffer(base).subscribe({ next: p => this.handleCreateSuccess(p), error: e => this.handleCreateError(e) });
    }
  }

  private handleCreateSuccess(p: CatalogResponseDto): void {
    this.successMessage = `"${p.name}" created!`;
    this.closeCreateModal();
    this.loadProducts();
    this.submitting = false;
    this.clearMessagesAfterDelay();
  }

  private handleCreateError(err: any): void {
    this.error = 'Failed to create product.';
    this.submitting = false;
    this.cdr.detectChanges();
  }

  // ── Edit ─────────────────────────────────────────────────

  openEditModal(product: CatalogResponseDto): void {
    this.isEditing = true;
    this.editingProductId = product.id;
    this.productForm.patchValue({
      name: product.name, description: product.description, basePrice: product.basePrice,
      available: product.available, imageURL: product.imageURL,
      vegetarian: (product as any).vegetarian || false,
      requiresPrescription: (product as any).requiresPrescription || false,
      dosage: (product as any).dosage || '', activeIngredient: (product as any).activeIngredient || '',
      weightInKg: (product as any).weightInKg || 0
    });
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetForm();
  }

  submitEdit(): void {
    if (this.productForm.invalid || !this.selectedStore || !this.editingProductId) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const fv = this.productForm.value;
    const base: CatalogRequestDto = {
      name: fv.name, description: fv.description, basePrice: fv.basePrice,
      available: fv.available, storeId: this.selectedStore.id,
      imageURL: fv.imageURL, type: this.selectedStore.category
    };

    const cat = this.selectedStore.category;
    let dto: any = base;
    if (cat === 'RESTAURANT') dto = { ...base, foodCategories: fv.foodCategories || [], availableExtras: (fv.availableExtras || '').split(',').filter((s: string) => s.trim()), ingredients: (fv.ingredients || '').split(',').filter((s: string) => s.trim()), vegetarian: fv.vegetarian, allergens: fv.allergens || '' };
    else if (cat === 'PHARMACY') dto = { ...base, requiresPrescription: fv.requiresPrescription, dosage: fv.dosage, activeIngredient: fv.activeIngredient, pharmacyCategories: fv.pharmacyCategories || [] };
    else if (cat === 'SUPERMARKET') dto = { ...base, weightInKg: fv.weightInKg, supermarketCategories: fv.supermarketCategories || [] };
    else if (cat === 'SPECIAL_DELIVERY') dto = { ...base, pricePerKm: fv.pricePerKm, pricePerKg: fv.pricePerKg, requiredVehicleType: fv.requiredVehicleType };

    this.catalogSvc.updateOffer(this.editingProductId, dto).subscribe({
      next: u => {
        this.successMessage = `"${u.name}" updated!`;
        this.closeEditModal();
        this.loadProducts();
        this.submitting = false;
        this.clearMessagesAfterDelay();
      },
      error: () => {
        this.error = 'Failed to update product.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Toggle Availability ──────────────────────────────────

  toggleAvailability(product: CatalogResponseDto): void {
    this.catalogSvc.toggleAvailability(product.id).subscribe({
      next: u => {
        Object.assign(product, u);
        this.successMessage = `Product ${u.available ? 'enabled' : 'disabled'}.`;
        this.applyFilters();
        this.clearMessagesAfterDelay();
      },
      error: () => {
        product.available = !product.available;
        this.error = 'Failed to update availability.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteProduct(product: CatalogResponseDto): void {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.catalogSvc.deleteOffer(product.id).subscribe({
      next: () => {
        this.successMessage = `"${product.name}" deleted.`;
        this.loadProducts();
        this.clearMessagesAfterDelay();
      },
      error: () => { this.error = 'Failed to delete product.'; this.cdr.detectChanges(); }
    });
  }

  // ── Promotion ────────────────────────────────────────────

  openPromotionModal(product: CatalogResponseDto): void {
    this.promoProductId = product.id;
    const pct = (product as any).percentage || 10;
    this.promotionForm.patchValue({ percentage: pct });
    this.showPromotionModal = true;
    this.cdr.detectChanges();
  }

  closePromotionModal(): void {
    this.showPromotionModal = false;
    this.promoProductId = null;
    this.promotionForm.reset({ percentage: 10 });
  }

  submitPromotion(): void {
    if (!this.promoProductId) {
      this.error = 'No product selected.';
      this.cdr.detectChanges();
      return;
    }

    // Force validation
    this.promotionForm.markAllAsTouched();
    if (this.promotionForm.invalid) {
      this.error = 'Please enter a valid percentage (1-90).';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.cdr.detectChanges();

    const pct = this.promotionForm.value.percentage;
    const pid = this.promoProductId;

    this.catalogSvc.applyPromotion(pid, pct).subscribe({
      next: u => {
        // Update local product data
        const p = this.products.find(x => x.id === pid);
        if (p) Object.assign(p, u);

        this.successMessage = `${pct}% promotion applied to "${u.name}"!`;
        this.showPromotionModal = false;
        this.promoProductId = null;
        this.submitting = false;
        this.promotionForm.reset({ percentage: 10 });
        this.applyFilters();
        this.cdr.detectChanges();
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Promotion failed:', err);
        this.error = 'Failed to apply promotion. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  removePromotion(product: CatalogResponseDto): void {
    if (!confirm(`Remove promotion from "${product.name}"?`)) return;
    this.catalogSvc.removePromotion(product.id).subscribe({
      next: u => {
        Object.assign(product, u);
        this.successMessage = `Promo removed from "${product.name}".`;
        this.applyFilters();
        this.clearMessagesAfterDelay();
      },
      error: () => {
        this.error = 'Failed to remove promotion.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── View Details ─────────────────────────────────────────

  viewDetails(product: CatalogResponseDto): void {
    this.selectedProduct = product;
    this.showDetailModal = true;
    this.cdr.detectChanges();
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedProduct = null;
  }

  // ── Helpers ──────────────────────────────────────────────

  /** Split comma-separated strings into trimmed non-empty array items */
  splitIfNeeded(value: string | string[]): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(s => s.trim());
    return value.split(',').map(s => s.trim()).filter(s => s);
  }

  getCategoryClass(type: string): string {
    const m: Record<string, string> = { RESTAURANT: 'orange', PHARMACY: 'green', SUPERMARKET: 'blue', SPECIAL_DELIVERY: 'purple' };
    return m[type] ?? 'gray';
  }

  getStars(rating?: number): string {
    const f = Math.round(rating ?? 0);
    return '★'.repeat(f) + '☆'.repeat(5 - f);
  }

  getStoreCategoryLabel(cat: string): string {
    const m: Record<string, string> = { RESTAURANT: 'Restaurant', PHARMACY: 'Pharmacy', SUPERMARKET: 'Supermarket', SPECIAL_DELIVERY: 'Special Delivery' };
    return m[cat] ?? cat;
  }

  getDiscountedPrice(p: CatalogResponseDto): number | null {
    if ((p as any).isPromotion && (p as any).originalPrice) return p.basePrice;
    return null;
  }

  clearMessagesAfterDelay(): void {
    setTimeout(() => { this.successMessage = ''; this.error = ''; this.cdr.detectChanges(); }, 4000);
  }

  // ── Pagination ───────────────────────────────────────────

  get paginatedProducts(): CatalogResponseDto[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(s, s + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.filteredProducts.length / this.pageSize); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  goToPage(page: number): void { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }
}
