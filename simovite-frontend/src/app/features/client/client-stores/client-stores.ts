import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { StoreService } from '@services/store.service';
import { StoreResponseDto, MainCategory } from '@models/store.model';

@Component({
  selector: 'app-client-stores',
  standalone: false,
  templateUrl: './client-stores.html',
  styleUrls: ['./client-stores.scss']
})
export class ClientStores implements OnInit {
  stores: StoreResponseDto[] = [];
  filteredStores: StoreResponseDto[] = [];
  loading = true;
  searchTerm = '';
  selectedCategory: string = '';

  categories = [
    { value: '', label: 'All Stores', icon: '🏪' },
    { value: 'RESTAURANT', label: 'Restaurants', icon: '🍕' },
    { value: 'PHARMACY', label: 'Pharmacies', icon: '💊' },
    { value: 'SUPERMARKET', label: 'Supermarkets', icon: '🛒' },
    { value: 'SPECIAL_DELIVERY', label: 'Special Delivery', icon: '📦' }
  ];

  MainCategory = MainCategory;

  constructor(
    private storeSvc: StoreService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.loading = true;
    this.storeSvc.getAllStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        this.filteredStores = stores;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load stores:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterStores(): void {
    this.filteredStores = this.stores.filter(store => {
      const matchCategory = !this.selectedCategory || store.category === this.selectedCategory;
      const matchSearch = !this.searchTerm ||
        store.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        store.address?.city?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
    this.cdr.detectChanges();
  }

  viewStore(store: StoreResponseDto): void {
    this.router.navigate(['/stores', store.id]);
  }

  getStars(rating: number | undefined): string {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.icon || '🏪';
  }
}
