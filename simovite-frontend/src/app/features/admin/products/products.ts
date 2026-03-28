import { Component, OnInit } from '@angular/core';
import { Product } from '@models/product.model'; // Vérifie bien le chemin !

@Component({ 
  selector: 'app-admin-products', 
  standalone: false, 
  templateUrl: './products.html', 
  styleUrls: ['./products.scss'] 
})
export class AdminProducts implements OnInit {
  // 1. Déclare explicitement TOUTES les propriétés utilisées dans le HTML
  products: Product[] = [];
  filtered: Product[] = [];
  loading = true;

  filterCategory = ''; 
  filterAvailability = ''; 
  searchTerm = ''; 
  currentPage = 1; 
  pageSize = 10;

  private mock: Product[] = [
    { id:'p1', name:'Pizza Margherita', description:'...', storeId:'s1', storeName:'Pizza Maarif', storeCategory:'RESTAURANT', basePrice:45, available:true, itemType:'PIZZA', rating:4.8 },
    { id:'p2', name:'Paracetamol 500mg', description:'...', storeId:'s2', storeName:'Pharmacie Centrale', storeCategory:'PHARMACY', basePrice:12.5, available:true, itemType:'MEDICINE', rating:4.6 },
    { id:'p3', name:'Lait Centrale 1L', description:'...', storeId:'s3', storeName:'Marjane Maarif', storeCategory:'SUPERMARKET', basePrice:8.5, available:false, itemType:'DAIRY', rating:4.2 },
    // ... reste de tes données
  ];

  ngOnInit(): void { 
    setTimeout(() => { 
      this.products = this.mock; 
      this.filtered = this.mock; 
      this.loading = false; 
    }, 400); 
  }

  // 2. Vérifie que la fonction est bien nommée applyFilters (au pluriel comme dans ton HTML)
  applyFilters(): void {
    this.filtered = this.products.filter(p =>
      (!this.filterCategory || p.storeCategory === this.filterCategory) &&
      (!this.filterAvailability || (this.filterAvailability === 'available' ? p.available : !p.available)) &&
      (!this.searchTerm || p.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.currentPage = 1;
  }

  // 3. Les "Getters" doivent être bien orthographiés
  get paginated(): Product[] { 
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); 
  }

  get totalPages(): number { 
    return Math.ceil(this.filtered.length / this.pageSize); 
  }

  get pages(): number[] { 
    return Array.from({ length: this.totalPages }, (_, i) => i + 1); 
  }

  // 4. Les méthodes d'action
  toggle(id: string): void { 
    const p = this.products.find(x => x.id === id); 
    if (p) p.available = !p.available; 
  }

  reset(): void { 
    this.filterCategory = ''; 
    this.filterAvailability = ''; 
    this.searchTerm = ''; 
    this.applyFilters(); 
  }

  getCategoryClass(c: string): string {
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