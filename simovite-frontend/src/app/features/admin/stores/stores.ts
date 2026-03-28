import { Component, OnInit } from '@angular/core';
import { StoreService } from '@services/store.service';
import { Store } from '@models/store.model'; // Assure-toi que le chemin est correct

@Component({ 
  selector: 'app-admin-stores', 
  standalone: false, 
  templateUrl: './stores.html', 
  styleUrls: ['./stores.scss'],
})
export class AdminStores implements OnInit {
  stores: Store[] = [];
  filtered: Store[] = [];
  loading = true;

  // Filtres
  filterCategory = ''; 
  filterStatus = ''; 
  searchTerm = '';

  // Données de test adaptées au modèle réel
  private mock: Store[] = [
    { 
      id: 's1', name: 'Pizza Maarif', category: 'RESTAURANT', ownerId: 'o1', ownerName: 'Ahmed M.', 
      rating: 4.8, reviewCount: 124, available: true, 
      address: { street: 'Rue 12', city: 'Casablanca', zipCode: '20000' } as any 
    },
    { 
      id: 's2', name: 'Pharmacie Centrale', category: 'PHARMACY', ownerId: 'o2', ownerName: 'Laila B.', 
      rating: 4.6, reviewCount: 89, available: true, 
      address: { street: 'Av. Anfa', city: 'Casablanca', zipCode: '20100' } as any 
    },
    { 
      id: 's3', name: 'Marjane Maarif', category: 'SUPERMARKET', ownerId: 'o3', ownerName: 'Rachid K.', 
      rating: 4.3, reviewCount: 67, available: false, 
      address: { street: 'Bvd Ghandi', city: 'Casablanca', zipCode: '20200' } as any 
    },
    { 
      id: 's4', name: 'Burger House', category: 'RESTAURANT', ownerId: 'o4', ownerName: 'Nadia S.', 
      rating: 4.9, reviewCount: 203, available: true, 
      address: { street: 'Derb Ghallef', city: 'Casablanca', zipCode: '20300' } as any 
    },
    { 
      id: 's5', name: 'Sushi King', category: 'RESTAURANT', ownerId: 'o5', ownerName: 'Youssef A.', 
      rating: 4.9, reviewCount: 311, available: true, 
      address: { street: 'Oasis', city: 'Casablanca', zipCode: '20400' } as any 
    },
    { 
      id: 's6', name: 'SimoVite Express', category: 'SPECIAL_DELIVERY', ownerId: 'admin', ownerName: 'Admin', 
      rating: 4.5, reviewCount: 88, available: true, 
      address: { street: 'Siege', city: 'Casablanca', zipCode: '20000' } as any 
    },
  ];

  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    this.storeService.getStores().subscribe({
      next: (data: Store[]) => {
        // Si l'API renvoie des données, on les utilise, sinon le mock
        this.stores = data && data.length > 0 ? data : this.mock;
        this.filtered = [...this.stores];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur API, chargement du mock', err);
        this.stores = this.mock;
        this.filtered = [...this.stores];
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.stores.filter(s => {
      const matchCategory = !this.filterCategory || s.category === this.filterCategory;
      const matchStatus = !this.filterStatus || (this.filterStatus === 'open' ? s.available : !s.available);
      const matchSearch = !this.searchTerm || s.name.toLowerCase().includes(term) || s.address.city.toLowerCase().includes(term);
      
      return matchCategory && matchStatus && matchSearch;
    });
  }

  toggleStoreStatus(id: string): void {
    const s = this.stores.find(x => x.id === id);
    if (s) {
      s.available = !s.available;
      // Optionnel : Appel service pour sauvegarder le changement en DB
      // this.storeService.updateStatus(id, s.available).subscribe();
    }
  }

  getCategoryClass(c: string): string {
    const m: Record<string, string> = { 
      RESTAURANT: 'orange', 
      PHARMACY: 'green', 
      SUPERMARKET: 'blue', 
      SPECIAL_DELIVERY: 'purple' 
    };
    return m[c] ?? 'gray';
  }

  getStars(r: number | undefined): string { 
    const rating = r ?? 0;
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating)); 
  }

  reset(): void { 
    this.filterCategory = ''; 
    this.filterStatus = ''; 
    this.searchTerm = ''; 
    this.applyFilters(); 
  }
}