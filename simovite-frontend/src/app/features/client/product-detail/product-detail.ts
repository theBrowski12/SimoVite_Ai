import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogResponseDto } from '@models/catalog.model';
import { CatalogService } from '@services/catalog.service';
import { StoreService } from '@services/store.service';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
    productId!: string;
  product: CatalogResponseDto | null = null;
  loading: boolean = true;
  storeName: string = 'Chargement de la boutique...';

  isEditing: boolean = false;
  storesList: any[] = [];
  // Données factices pour la structure - À remplacer par tes appels API (OrderService, ReviewService)
  statistics = {
    totalSold: 145,
    revenueGenerated: 2175.00,
    averageRating: 4.5,
    viewsThisWeek: 340
  };

  recentOrders = [
    { id: 'ORD-001', date: '2026-03-28', customer: 'Jean Dupont', quantity: 2, status: 'DELIVERED' },
    { id: 'ORD-002', date: '2026-03-29', customer: 'Alice Martin', quantity: 1, status: 'PENDING' }
  ];

  reviews = [
    { user: 'Marc', rating: 5, comment: 'Excellent produit, très satisfait !', date: '2026-03-25' },
    { user: 'Sophie', rating: 4, comment: 'Bonne qualité mais livraison un peu longue.', date: '2026-03-20' }
  ];

  constructor(
    private route: ActivatedRoute,
    private catalogService: CatalogService,
    private cdr: ChangeDetectorRef ,
    private storeService: StoreService // ⚡️ 3. Injecte le StoreService ici
  ) {}

ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (this.productId) {
      this.loadProductDetails();
      this.loadAllStores(); // ⚡️ Charger les magasins pour le formulaire
    } else {
      this.loading = false; 
    }
  }
loadProductDetails(): void {
    this.loading = true;
    this.catalogService.getOfferById(this.productId).subscribe({
      next: (data) => {
        this.product = data;
        if (this.product.storeId) {
          this.loadStoreName(this.product.storeId);
        } else {
          this.storeName = 'Boutique non assignée';
        }
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Erreur de l\'API :', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ⚡️ 5. Nouvelle méthode pour récupérer la boutique
loadStoreName(storeId: string): void {
    this.storeService.getStoreById(storeId).subscribe({
      next: (store) => {
        this.storeName = store.name; 
        this.cdr.detectChanges();
      },
      error: () => {
        this.storeName = 'Boutique inconnue';
        this.cdr.detectChanges();
      }
    });
  }
 loadAllStores(): void {
    // Vérifie le nom exact de ta méthode dans StoreService (ex: getAllStores() ou getStores())
    this.storeService.getAllStores().subscribe({
      next: (stores) => {
        this.storesList = stores;
      },
      error: (err) => console.error('Erreur lors du chargement des magasins', err)
    });
  }

  onUpdate(): void {
    if (!this.product) return;
    this.isEditing = true; // ⚡️ Bascule en mode édition
  }

  // ⚡️ NOUVEAU : Annuler la modification
  onEditCancel(): void {
    this.isEditing = false;
  }

  // ⚡️ NOUVEAU : Sauvegarde réussie depuis le formulaire
// ⚡️ NOUVEAU : Sauvegarde réussie depuis le formulaire
  onEditSaved(updatedProduct: any): void {
    // 1. On quitte immédiatement le mode édition pour réafficher la page de détails
    this.isEditing = false; 

    // 2. Si le backend nous a renvoyé le produit mis à jour directement, on l'utilise !
    if (updatedProduct && updatedProduct.id) {
      this.product = updatedProduct;
      if (this.product?.storeId) {
        this.loadStoreName(this.product.storeId);
      }
    } 
    // 3. Sinon, on recharge les données en arrière-plan (SANS remettre loading à true)
    else {
      this.refreshProductDetails(); 
    }
    
    // On force la mise à jour de l'affichage
    this.cdr.detectChanges();
  }

  // ⚡️ NOUVEAU : Rechargement en arrière-plan sans faire clignoter l'écran complet
  refreshProductDetails(): void {
    this.catalogService.getOfferById(this.productId).subscribe({
      next: (data) => {
        this.product = data;
        if (this.product.storeId) {
          this.loadStoreName(this.product.storeId);
        } else {
          this.storeName = 'Boutique non assignée';
        }
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Erreur lors du rafraîchissement des données :', err);
      }
    });
  }

  onDelete(): void {
    if (!this.product) return;
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer le produit "${this.product.name}" ?`);
    if (confirmDelete) {
      console.log('Suppression confirmée pour le produit :', this.product.id);
      // this.catalogService.deleteProduct(this.product.id).subscribe(...)
    }
  }

  goBack(): void {
    window.history.back();
  }
}
