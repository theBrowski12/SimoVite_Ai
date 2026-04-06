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
import { StoreResponseDto } from '@models/store.model';

interface ProductFormData {
  name: string;
  description: string;
  basePrice: number;
  available: boolean;
  imageURL: string;
  vegetarian: boolean;
  // Restaurant fields
  foodCategories: FoodCategory[];
  // Pharmacy fields
  requiresPrescription: boolean;
  dosage: string;
  activeIngredient: string;
  pharmacyCategories: PharmacyCategory[];
  // Supermarket fields
  weightInKg: number;
  supermarketCategories: SupermarketCategory[];
}

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
  showCreateModal = false;
  showEditModal = false;
  submitting = false;
  isEditing = false;
  editingProductId: string | null = null;

  // Filters
  searchTerm = '';
  filterAvailability = '';
  filterCategory = '';

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

  constructor(
    private catalogSvc: CatalogService,
    private storeSvc: StoreService,
    private keycloak: KeycloakService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
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
      vegetarian: [false],
      foodCategories: [[]],
      requiresPrescription: [false],
      dosage: [''],
      activeIngredient: [''],
      pharmacyCategories: [[]],
      weightInKg: [0, Validators.min(0)],
      supermarketCategories: [[]]
    });
  }

  resetForm(): void {
    this.productForm.reset({
      name: '',
      description: '',
      basePrice: 0,
      available: true,
      imageURL: '',
      vegetarian: false,
      foodCategories: [],
      requiresPrescription: false,
      dosage: '',
      activeIngredient: '',
      pharmacyCategories: [],
      weightInKg: 0,
      supermarketCategories: []
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
    this.loading = true;
    this.cdr.detectChanges();
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

      const matchAvailability = !this.filterAvailability ||
        (this.filterAvailability === 'available' ? p.available : !p.available);

      const matchCategory = !this.filterCategory || this.productMatchesCategory(p, this.filterCategory);

      return matchSearch && matchAvailability && matchCategory;
    });

    this.currentPage = 1;
  }

  private productMatchesCategory(product: CatalogResponseDto, category: string): boolean {
    if (product.type === 'RESTAURANT' && (product as any).foodCategories) {
      return (product as any).foodCategories.includes(category);
    }
    if (product.type === 'PHARMACY' && (product as any).pharmacyCategories) {
      return (product as any).pharmacyCategories.includes(category);
    }
    if (product.type === 'SUPERMARKET' && (product as any).supermarketCategories) {
      return (product as any).supermarketCategories.includes(category);
    }
    return false;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterAvailability = '';
    this.filterCategory = '';
    this.applyFilters();
  }

  // ── Create Product ───────────────────────────────────────

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
    const formValues = this.productForm.value;

    const baseDto: CatalogRequestDto = {
      name: formValues.name,
      description: formValues.description,
      basePrice: formValues.basePrice,
      available: formValues.available,
      storeId: this.selectedStore.id,

      imageURL: formValues.imageURL,
      type: this.selectedStore.category
    };

    // Build category-specific DTO
    let requestDto: any = baseDto;

    if (this.selectedStore.category === 'RESTAURANT') {
      requestDto = {
        ...baseDto,
        foodCategories: formValues.foodCategories || [],
        availableExtras: [],
        ingredients: [],
        vegetarian: formValues.vegetarian,
        allergens: ''
      };
      this.catalogSvc.createRestaurantItem(requestDto).subscribe({
        next: (product) => this.handleCreateSuccess(product),
        error: (err) => this.handleCreateError(err)
      });
    } else if (this.selectedStore.category === 'PHARMACY') {
      requestDto = {
        ...baseDto,
        requiresPrescription: formValues.requiresPrescription,
        dosage: formValues.dosage,
        activeIngredient: formValues.activeIngredient,
        pharmacyCategories: formValues.pharmacyCategories || []
      };
      this.catalogSvc.createPharmacyItem(requestDto).subscribe({
        next: (product) => this.handleCreateSuccess(product),
        error: (err) => this.handleCreateError(err)
      });
    } else if (this.selectedStore.category === 'SUPERMARKET') {
      requestDto = {
        ...baseDto,
        weightInKg: formValues.weightInKg,
        supermarketCategories: formValues.supermarketCategories || []
      };
      this.catalogSvc.createSupermarketItem(requestDto).subscribe({
        next: (product) => this.handleCreateSuccess(product),
        error: (err) => this.handleCreateError(err)
      });
    } else {
      this.catalogSvc.createOffer(requestDto).subscribe({
        next: (product) => this.handleCreateSuccess(product),
        error: (err) => this.handleCreateError(err)
      });
    }
  }

  private handleCreateSuccess(product: CatalogResponseDto): void {
    this.successMessage = `"${product.name}" has been created successfully!`;
    this.closeCreateModal();
    this.loadProducts();
    this.submitting = false;
    this.clearMessagesAfterDelay();
  }

  private handleCreateError(err: any): void {
    console.error('Create failed:', err);
    this.error = 'Failed to create product. Please try again.';
    this.submitting = false;
    this.cdr.detectChanges();
  }

  // ── Edit Product ─────────────────────────────────────────

  openEditModal(product: CatalogResponseDto): void {
    this.isEditing = true;
    this.editingProductId = product.id;

    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      available: product.available,
      imageURL: product.imageURL,
      vegetarian: (product as any).vegetarian || false,
      requiresPrescription: (product as any).requiresPrescription || false,
      dosage: (product as any).dosage || '',
      activeIngredient: (product as any).activeIngredient || '',
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
    const formValues = this.productForm.value;

    const baseDto: CatalogRequestDto = {
      name: formValues.name,
      description: formValues.description,
      basePrice: formValues.basePrice,
      available: formValues.available,
      storeId: this.selectedStore.id,
      imageURL: formValues.imageURL,
      type: this.selectedStore.category
    };

    let requestDto: any = baseDto;

    if (this.selectedStore.category === 'RESTAURANT') {
      requestDto = {
        ...baseDto,
        foodCategories: formValues.foodCategories || [],
        availableExtras: [],
        ingredients: [],
        vegetarian: formValues.vegetarian,
        allergens: ''
      };
    } else if (this.selectedStore.category === 'PHARMACY') {
      requestDto = {
        ...baseDto,
        requiresPrescription: formValues.requiresPrescription,
        dosage: formValues.dosage,
        activeIngredient: formValues.activeIngredient,
        pharmacyCategories: formValues.pharmacyCategories || []
      };
    } else if (this.selectedStore.category === 'SUPERMARKET') {
      requestDto = {
        ...baseDto,
        weightInKg: formValues.weightInKg,
        supermarketCategories: formValues.supermarketCategories || []
      };
    }

    this.catalogSvc.updateOffer(this.editingProductId, requestDto).subscribe({
      next: (updated) => {
        this.successMessage = `"${updated.name}" has been updated successfully!`;
        this.closeEditModal();
        this.loadProducts();
        this.submitting = false;
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.error = 'Failed to update product. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Toggle Availability ──────────────────────────────────

  toggleAvailability(product: CatalogResponseDto): void {
    this.catalogSvc.toggleAvailability(product.id).subscribe({
      next: (updated) => {
        Object.assign(product, updated);
        this.successMessage = `Product ${updated.available ? 'enabled' : 'disabled'}.`;
        this.applyFilters();
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Toggle failed:', err);
        product.available = !product.available;
        this.error = 'Failed to update availability.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Delete Product ───────────────────────────────────────

  deleteProduct(product: CatalogResponseDto): void {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This cannot be undone.`)) {
      return;
    }

    this.catalogSvc.deleteOffer(product.id).subscribe({
      next: () => {
        this.successMessage = `"${product.name}" has been deleted.`;
        this.loadProducts();
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.error = 'Failed to delete product. Please try again.';
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

  getCategoryClass(type: string): string {
    const m: Record<string, string> = {
      RESTAURANT: 'orange',
      PHARMACY: 'green',
      SUPERMARKET: 'blue',
      SPECIAL_DELIVERY: 'purple'
    };
    return m[type] ?? 'gray';
  }

  getStars(rating: number | undefined): string {
    const r = rating ?? 0;
    const full = Math.round(r);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getStoreCategoryLabel(category: string): string {
    const m: Record<string, string> = {
      RESTAURANT: 'Restaurant',
      PHARMACY: 'Pharmacy',
      SUPERMARKET: 'Supermarket',
      SPECIAL_DELIVERY: 'Special Delivery'
    };
    return m[category] ?? category;
  }

  formatCategories(categories: string[]): string {
    if (!categories || categories.length === 0) return 'No categories';
    return categories.join(', ');
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.error = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  // ── Pagination ───────────────────────────────────────────

  get paginatedProducts(): CatalogResponseDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
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
