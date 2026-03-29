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

  // Données du tableau
products: CatalogResponseDto[] = [];
  filtered: CatalogResponseDto[] = [];
  stores: StoreResponseDto[] = [];
  storesMap = new Map<string, StoreResponseDto>();
  loading = true;

  // Filtres principaux
  filterMainType = ''; 
  filterAvailability = ''; 
  searchTerm = ''; 

  // Multi-sélections (Tableaux)
  selectedFoodCategories: string[] = [];
  selectedPharmacyCategories: string[] = [];
  selectedSupermarketCategories: string[] = [];

  // Listes pour l'UI
  foodCategoriesList = Object.values(FoodCategory);
  pharmacyCategoriesList = Object.values(PharmacyCategory);
  supermarketCategoriesList = Object.values(SupermarketCategory);

  currentPage = 1; 
  pageSize = 10;
  showModal = false;
  productToEdit: any = null;

  constructor(
    private catalogService: CatalogService,
    private storeService: StoreService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void { 
    this.loadData();
  }

  goToDetails(id: string) {
    if (id) {
      this.router.navigate(['/admin/products', id]);
    }
  }

  // --- CHARGEMENT DES DONNÉES ---

  loadData(): void {
    this.loading = true;
    this.storeService.getAllStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        stores.forEach(store => this.storesMap.set(store.id, store));
        this.loadProducts(); // Charge tout par défaut au début
      },
      error: (err) => {
        console.error('Erreur stores', err);
        this.loadProducts();
      }
    });
  }

  toggleCategory(type: 'FOOD' | 'PHARMACY' | 'SUPERMARKET', value: string) {
  // 1. On récupère la liste actuelle
  let list = type === 'FOOD' ? this.selectedFoodCategories : 
             type === 'PHARMACY' ? this.selectedPharmacyCategories : 
             this.selectedSupermarketCategories;

  const index = list.indexOf(value);
  
  // 2. On crée une NOUVELLE instance de l'array (Immuabilité)
  // C'est ce qui permet à Angular de détecter le changement instantanément
  if (index > -1) {
    list.splice(index, 1);
  } else {
    list.push(value);
  }

  // 3. IMPORTANT : On réassigne pour changer la référence
  if (type === 'FOOD') this.selectedFoodCategories = [...list];
  if (type === 'PHARMACY') this.selectedPharmacyCategories = [...list];
  if (type === 'SUPERMARKET') this.selectedSupermarketCategories = [...list];

  // 4. On applique les filtres et on force la détection
  this.applyLocalFilters();
}

  // ⚡️ MÉTHODE DYNAMIQUE : Appelle la bonne API selon les filtres
loadProducts(): void {
  this.loading = true;
  this.cdr.detectChanges();
  if (this.searchTerm?.trim()) {
    this.catalogService.searchOffersByName(this.searchTerm).subscribe(this.handleBackendResponse());
  } 
  else if (this.filterMainType) {
    // On charge TOUS les produits du type (ex: Restaurant) 
    // et on filtrera les sous-catégories localement pour la multi-sélection
    this.catalogService.getProductsByMainType(this.filterMainType).subscribe(this.handleBackendResponse());
  } 
  else {
    this.catalogService.getAllOffers().subscribe(this.handleBackendResponse());
  }
}

applyLocalFilters(): void {
    this.filtered = this.products.filter(p => {
      // 1. Disponibilité
      let matchAvailability = true;
      if (this.filterAvailability === 'available_api') matchAvailability = p.available === true;
      if (this.filterAvailability === 'unavailable') matchAvailability = p.available === false;

      // 2. Multi-Catégories (On utilise (p as any) pour éviter l'erreur TS2339)
      let matchSubCategory = true;
      const product = p as any; 

      if (this.filterMainType === 'RESTAURANT' && this.selectedFoodCategories.length > 0) {
        matchSubCategory = product.foodCategories?.some((cat: string) => this.selectedFoodCategories.includes(cat)) ?? false;
      }
      else if (this.filterMainType === 'PHARMACY' && this.selectedPharmacyCategories.length > 0) {
        matchSubCategory = product.pharmacyCategories?.some((cat: string) => this.selectedPharmacyCategories.includes(cat)) ?? false;
      }
      else if (this.filterMainType === 'SUPERMARKET' && this.selectedSupermarketCategories.length > 0) {
        matchSubCategory = product.supermarketCategories?.some((cat: string) => this.selectedSupermarketCategories.includes(cat)) ?? false;
      }

      return matchAvailability && matchSubCategory;
    });
    
    this.currentPage = 1;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Factorisation de la réponse du backend pour éviter de répéter le code
  private handleBackendResponse() {
    return {
      next: (data: CatalogResponseDto[]) => {
        this.products = data || [];
        this.applyLocalFilters(); // Applique les filtres secondaires sur les résultats
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des produits', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    };
  }

  // --- GESTION DE LA MODALE ---

  openAddModal(): void {
    this.productToEdit = null;
    this.showModal = true;
  }

  openEditModal(product: CatalogResponseDto): void {
    this.productToEdit = product;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.productToEdit = null;
  }

  onProductSaved(result: any): void {
    console.log('Produit sauvegardé avec succès !', result);
    this.closeModal();
    this.loadProducts(); 
  }

  // --- ACTIONS SUR LE TABLEAU ---

  toggle(product: CatalogResponseDto): void { 
    product.available = !product.available; 
    this.catalogService.toggleAvailability(product.id).subscribe({
      next: () => console.log(`Disponibilité modifiée pour ${product.name}`),
      error: (err) => {
        product.available = !product.available; // rollback en cas d'erreur
        console.error('Erreur lors du toggle', err);
      }
    });
  }

  deleteProduct(product: any): void {
    if(confirm(`Es-tu sûr de vouloir supprimer ${product.name} ?`)) {
      this.catalogService.deleteOffer(product.id).subscribe(() => {
        this.loadProducts();
      });
    }
  }

  // --- FILTRES LOCAUX (Si la requête API ramène un peu trop de choses) ---

onMainTypeChange(): void {
  this.selectedFoodCategories = [];
  this.selectedPharmacyCategories = [];
  this.selectedSupermarketCategories = [];
  this.loadProducts();
}

  // ⚡️ DÉCLENCHEUR QUAND L'UTILISATEUR MODIFIE UN FILTRE DANS L'UI
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProducts(); // Va refaire un appel API ciblé !
  }

reset(): void { 
    this.searchTerm = ''; 
    this.filterAvailability = ''; 
    this.filterMainType = '';
    this.selectedFoodCategories = [];
    this.selectedPharmacyCategories = [];
    this.selectedSupermarketCategories = [];
    this.currentPage = 1;
    this.loadProducts(); 
  }

  // --- GETTERS (Pagination et Utilitaires) ---

  get paginated(): CatalogResponseDto[] { 
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); 
  }
  get totalPages(): number { 
    return Math.ceil(this.filtered.length / this.pageSize); 
  }
  get pages(): number[] { 
    return Array.from({ length: this.totalPages || 1 }, (_, i) => i + 1); 
  }

  getStoreName(storeId: string): string {
    return this.storesMap.get(storeId)?.name || 'N/A';
  }
  getStoreCategory(storeId: string): string {
    return this.storesMap.get(storeId)?.category || '';
  }

  getCategoryClass(c: string | undefined): string {
    if (!c) return 'badge-gray';
    const m: Record<string, string> = { 
      RESTAURANT: 'badge-orange', 
      PHARMACY: 'badge-green', 
      SUPERMARKET: 'badge-blue', 
      SPECIAL_DELIVERY: 'badge-purple' 
    };
    return m[c] ?? 'badge-gray';
  }

  getStars(r: number | undefined): string { 
    const rating = r ?? 0;
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating)); 
  }
}