import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '@services/store.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { StoreRequestDto, StoreResponseDto, MainCategory } from '@models/store.model';
import * as L from 'leaflet';

interface StoreFormData {
  name: string;
  category: MainCategory;
  phone: string;
  description: string;
  imageURL: string;
  city: string;
  street: string;
  buildingNumber: string;
  apartment: string;
  latitude: number | null;
  longitude: number | null;
}

@Component({
  selector: 'app-store-profile',
  standalone: false,
  templateUrl: './store-profile.html',
  styleUrls: ['./store-profile.scss']
})
export class StoreProfile implements OnInit, AfterViewInit {
  // Data
  stores: StoreResponseDto[] = [];
  selectedStore: StoreResponseDto | null = null;
  loading = true;
  error = '';
  successMessage = '';

  // Form
  storeForm!: FormGroup;
  isEditing = false;
  showCreateModal = false;
  showEditModal = false;
  submitting = false;

  // Map
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  // Display helpers
  ownerName = '';
  activeTab: 'stores' | 'create' = 'stores';
  searchTerm = '';
  filteredStores: StoreResponseDto[] = [];

  constructor(
    private storeService: StoreService,
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

  ngAfterViewInit(): void {
    // Map initialization will be triggered when modal opens
  }

  // ── Form Initialization ──────────────────────────────────

  private initForm(): void {
    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      category: [MainCategory.RESTAURANT, Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,}$/)]],
      description: ['', Validators.maxLength(500)],
      imageURL: ['', Validators.pattern(/^https?:\/\/.+/)],
      city: ['', Validators.required],
      street: ['', Validators.required],
      buildingNumber: [''],
      apartment: [''],
      latitude: [null],
      longitude: [null]
    });
  }

  resetForm(): void {
    this.storeForm.reset({
      name: '',
      category: MainCategory.RESTAURANT,
      phone: '',
      description: '',
      imageURL: '',
      city: '',
      street: '',
      buildingNumber: '',
      apartment: '',
      latitude: null,
      longitude: null
    });
  }

  // ── Load Stores ──────────────────────────────────────────

  loadStores(selectStoreId?: string): void {
    this.loading = true;
    this.error = '';
    const userId = this.keycloak.getUserId();

    this.storeService.getStoresByOwner(userId).subscribe({
      next: (stores) => {
        this.stores = stores;
        this.filteredStores = stores;

        // Re-select the correct store if ID is provided
        if (selectStoreId) {
          this.selectedStore = stores.find(s => s.id === selectStoreId) || stores[0] || null;
        } else if (stores.length > 0 && !this.selectedStore) {
          this.selectedStore = stores[0];
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch stores:', err);
        this.error = 'Failed to load your stores. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Search Stores ──────────────────────────────────────────

  onSearchChange(): void {
    this.filterStores();
  }

  private filterStores(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredStores = this.stores;
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredStores = this.stores.filter(store =>
        store.name.toLowerCase().includes(term) ||
        store.category.toLowerCase().includes(term) ||
        store.description?.toLowerCase().includes(term) ||
        store.address?.city?.toLowerCase().includes(term) ||
        store.phone?.toLowerCase().includes(term)
      );
    }
  }

  // ── Select Store ─────────────────────────────────────────

  selectStore(store: StoreResponseDto): void {
    this.selectedStore = store;
  }

  // ── Create Store ─────────────────────────────────────────

  openCreateModal(): void {
    this.isEditing = false;
    this.resetForm();
    this.showCreateModal = true;
    this.activeTab = 'create';
    setTimeout(() => this.initMap(), 200);
    this.cdr.detectChanges();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.activeTab = 'stores';
    this.resetForm();
  }

  submitCreate(): void {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValues = this.storeForm.value;
    const requestDto: StoreRequestDto = {
      name: formValues.name,
      category: formValues.category,
      phone: formValues.phone,
      description: formValues.description,
      address: {
        city: formValues.city,
        street: formValues.street,
        buildingNumber: formValues.buildingNumber,
        apartment: formValues.apartment,
        latitude: formValues.latitude || 33.5731,
        longitude: formValues.longitude || -7.5898
      },
      imageURL: formValues.imageURL,
      open: true
    };

    this.storeService.createStore(requestDto).subscribe({
      next: (store) => {
        this.successMessage = `"${store.name}" has been created successfully!`;
        this.closeCreateModal();
        this.loadStores();
        this.selectedStore = store;
        this.submitting = false;
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Create failed:', err);
        this.error = 'Failed to create store. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Edit Store ───────────────────────────────────────────

  openEditModal(): void {
    if (!this.selectedStore) return;

    this.isEditing = true;
    const store = this.selectedStore;

    this.storeForm.patchValue({
      name: store.name,
      category: store.category,
      phone: store.phone,
      description: store.description,
      imageURL: store.imageURL,
      city: store.address?.city || '',
      street: store.address?.street || '',
      buildingNumber: store.address?.buildingNumber || '',
      apartment: store.address?.apartment || '',
      latitude: store.address?.latitude || 33.5731,
      longitude: store.address?.longitude || -7.5898
    });

    this.showEditModal = true;
    setTimeout(() => this.initMap(), 200);
    this.cdr.detectChanges();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.resetForm();
  }

  submitEdit(): void {
    if (this.storeForm.invalid || !this.selectedStore) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValues = this.storeForm.value;
    const requestDto: StoreRequestDto = {
      name: formValues.name,
      category: formValues.category,
      phone: formValues.phone,
      description: formValues.description,
      address: {
        city: formValues.city,
        street: formValues.street,
        buildingNumber: formValues.buildingNumber,
        apartment: formValues.apartment,
        latitude: formValues.latitude || 33.5731,
        longitude: formValues.longitude || -7.5898
      },
      imageURL: formValues.imageURL,
      open: this.selectedStore.open
    };

    this.storeService.updateStore(this.selectedStore.id, requestDto).subscribe({
      next: (updated) => {
        this.successMessage = `"${updated.name}" has been updated successfully!`;
        const updatedStoreId = this.selectedStore!.id;
        this.closeEditModal();
        this.loadStores(updatedStoreId);
        this.submitting = false;
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.error = 'Failed to update store. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Toggle Store Status ──────────────────────────────────

  toggleStoreStatus(): void {
    if (!this.selectedStore) return;

    const newStatus = !this.selectedStore.open;
    this.selectedStore.open = newStatus;

    const requestDto: StoreRequestDto = {
      name: this.selectedStore.name,
      category: this.selectedStore.category,
      phone: this.selectedStore.phone,
      description: this.selectedStore.description,
      address: this.selectedStore.address,
      imageURL: this.selectedStore.imageURL,
      open: newStatus
    };

    this.storeService.updateStore(this.selectedStore.id, requestDto).subscribe({
      next: (updated) => {
        Object.assign(this.selectedStore!, updated);
        this.successMessage = `Store ${newStatus ? 'opened' : 'closed'} successfully!`;
        this.loadStores();
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Status toggle failed:', err);
        this.selectedStore!.open = !newStatus;
        this.error = 'Failed to update store status.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Delete Store ─────────────────────────────────────────

  deleteStore(store: StoreResponseDto): void {
    if (!confirm(`Are you sure you want to delete "${store.name}"? This action cannot be undone.`)) {
      return;
    }

    this.storeService.deleteStore(store.id).subscribe({
      next: () => {
        this.successMessage = `"${store.name}" has been deleted.`;
        this.selectedStore = null;
        this.loadStores();
        this.clearMessagesAfterDelay();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.error = 'Failed to delete store. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Map Initialization ───────────────────────────────────

  private initMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.marker = undefined;
    }

    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (!mapElement) return;

      const currentLat = this.storeForm.get('latitude')?.value || 33.5731;
      const currentLng = this.storeForm.get('longitude')?.value || -7.5898;

      this.map = L.map('map', {
        center: [currentLat, currentLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });

      this.marker = L.marker([currentLat, currentLng], { 
        icon,
        draggable: true 
      }).addTo(this.map);

      this.marker.bindPopup('Drag to set store location').openPopup();

      this.marker.on('dragend', (event: any) => {
        const position = event.target.getLatLng();
        this.storeForm.patchValue({
          latitude: position.lat,
          longitude: position.lng
        });
      });

      this.map.on('click', (e: L.LeafletMouseEvent) => {
        if (this.marker) {
          this.marker.setLatLng(e.latlng);
        }

        this.storeForm.patchValue({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
      });

      this.map.invalidateSize();
    }, 100);
  }

  // ── Address Search ───────────────────────────────────────

  async searchAddress(query: string): Promise<void> {
    if (!query || query.trim() === '') {
      this.error = 'Please enter an address to search.';
      this.cdr.detectChanges();
      return;
    }

    try {
      const searchQuery = `${query}, Morocco`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        if (this.map && this.marker) {
          const newLatLng = new L.LatLng(lat, lon);
          this.map.setView(newLatLng, 16, { animate: true });
          this.marker.setLatLng(newLatLng);
        }

        this.storeForm.patchValue({
          latitude: lat,
          longitude: lon
        });

        this.successMessage = 'Location found and updated!';
        this.error = '';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      } else {
        this.error = 'Address not found. Try adding more details (e.g., street, city).';
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Address search error:', error);
      this.error = 'Failed to search address. Please try again.';
      this.cdr.detectChanges();
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  getCategoryClass(category: MainCategory): string {
    const m: Record<MainCategory, string> = {
      RESTAURANT: 'orange',
      PHARMACY: 'green',
      SUPERMARKET: 'blue',
      SPECIAL_DELIVERY: 'purple'
    };
    return m[category] ?? 'gray';
  }

  getStars(rating: number | undefined): string {
    const r = rating ?? 0;
    const full = Math.round(r);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getCategoryLabel(category: MainCategory): string {
    const m: Record<MainCategory, string> = {
      RESTAURANT: 'Restaurant',
      PHARMACY: 'Pharmacy',
      SUPERMARKET: 'Supermarket',
      SPECIAL_DELIVERY: 'Special Delivery'
    };
    return m[category] ?? category;
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.error = '';
      this.cdr.detectChanges();
    }, 4000);
  }
}
