import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { StoreService } from '@services/store.service';
import { StoreResponseDto, MainCategory } from '@models/store.model';

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
  loading = true;

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
protected readonly Math = Math;
constructor(private storeService: StoreService,private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initCategories();
    this.loadStores();
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
}