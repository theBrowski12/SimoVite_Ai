import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { StoreService } from '@services/store.service';
import { StoreRequestDto, StoreResponseDto } from '@models/store.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KeycloakAdminService } from '@services/keycloak-admin.service';
import * as L from 'leaflet';

@Component({ 
  selector: 'app-admin-stores', 
  standalone: false, 
  templateUrl: './stores.html', 
  styleUrls: ['./stores.scss'],
})
export class AdminStores implements OnInit {
  
  stores: StoreResponseDto[] = [];
  filtered: StoreResponseDto[] = [];
  loading = true;
  showModal = false;
  isEditing = false;
  editingStoreId: string | null = null;
  storeForm!: FormGroup;
  // Filtres
  filterCategory = '';
  filterStatus = '';
  searchTerm = '';
  // Detail panel
  selectedStore: StoreResponseDto | null = null;
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  // Données de test adaptées au modèle réel
  private mock: any[] = [
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

  constructor(
    private storeService: StoreService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private keycloakAdmin: KeycloakAdminService
  ) {this.initForm();}

  ngOnInit(): void {this.loadStores();}

initForm(): void {
    this.storeForm = this.fb.group({
      name: ['', Validators.required],
      category: ['RESTAURANT', Validators.required],
      phone: ['', Validators.required],
      description: [''],
      imageURL: [''],
      // Adresse
      city: ['', Validators.required],
      street: ['', Validators.required],
      buildingNumber: [''], // 👈 NOUVEAU
      apartment: [''],      // 👈 NOUVEAU
      latitude: [null],     // 👈 NOUVEAU
      longitude: [null]     // 👈 NOUVEAU
    });
  }

  openEditModal(store: StoreResponseDto): void {
    this.isEditing = true;
    this.editingStoreId = store.id;
    
    // Pré-remplir avec les nouvelles données
    this.storeForm.patchValue({
      name: store.name,
      category: store.category,
      phone: store.phone,
      description: store.description,
      imageURL: store.imageURL,
      // On sécurise avec le "?" au cas où address est undefined
      city: store.address?.city,
      street: store.address?.street,
      buildingNumber: store.address?.buildingNumber, // 👈 NOUVEAU
      apartment: store.address?.apartment,           // 👈 NOUVEAU
      latitude: store.address?.latitude || 33.5731,
      longitude: store.address?.longitude || -7.5898
    });
    
    this.showModal = true;
    setTimeout(() => this.initMap(), 100);
  }

  loadStores(): void {
    this.loading = true;
    this.storeService.getAllStores().subscribe({
      next: (data) => {
        this.stores = data && data.length > 0 ? data : this.mock;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur API', err);
        this.stores = this.mock;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

applyFilters(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.stores.filter(s => {
      const matchCategory = !this.filterCategory || s.category === this.filterCategory;
      const matchStatus = !this.filterStatus || (this.filterStatus === 'open' ? s.open : !s.open);
      
      // 3. Sécurisation de la recherche : on vérifie que s.address et s.address.city existent
      const matchSearch = !this.searchTerm || 
        (s.name && s.name.toLowerCase().includes(term)) || 
        (s.address && s.address.city && s.address.city.toLowerCase().includes(term));
      
      return matchCategory && matchStatus && matchSearch;
    });
  }

  toggleStoreStatus(id: string): void {
    const s = this.stores.find(x => x.id === id);
    if (s) {
      s.open = !s.open;
      this.storeService.updateStore(id, {
        name: s.name,
        description: s.description,
        category: s.category,
        address: s.address,
        phone: s.phone,
        imageURL: s.imageURL,
        open: s.open
      } as StoreRequestDto).subscribe({
        next: (updated) => {
          // Optionnel : Mettre à jour localement avec la réponse de l'API
          Object.assign(s, updated);
          this.applyFilters(); // Re-appliquer les filtres pour rafraîchir la vue
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du statut', err);
          // Optionnel : Revenir en arrière en cas d'erreur
          s.open = !s.open;
        }
      }); 
     
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

  openCreateModal(): void {
    this.isEditing = false;
    this.editingStoreId = null;
    this.storeForm.reset({ category: 'RESTAURANT', latitude: 33.5731, longitude: -7.5898 });    
    this.showModal = true;
    setTimeout(() => this.initMap(), 100);
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ==========================================
  // ACTIONS CRUD (CREATE, UPDATE, DELETE)
  // ==========================================

  saveStore(): void {
    if (this.storeForm.invalid) return;

    const formValues = this.storeForm.value;
    
    // Construire l'objet Request DTO
    const requestDto: StoreRequestDto = {
      name: formValues.name,
      category: formValues.category,
      phone: formValues.phone,
      description: formValues.description,
      address: {
        city: formValues.city,
        street: formValues.street,
        buildingNumber: formValues.buildingNumber,
        apartment:formValues.apartment,
        latitude: formValues.latitude,
        longitude: formValues.longitude,
      },
      imageURL: formValues.imageURL,
      open: true // Ouvert par défaut à la création
    };  

    if (this.isEditing && this.editingStoreId) {
      // --- UPDATE ---
      this.storeService.updateStore(this.editingStoreId, requestDto).subscribe({
        next: () => {
          this.loadStores(); // Rafraîchir la liste
          this.closeModal();
        },
        error: (err) => console.error('Erreur Update', err)
      });
    } else {
      // --- CREATE ---
      this.storeService.createStore(requestDto).subscribe({
        next: () => {
          this.loadStores();
          this.closeModal();
        },
        error: (err) => console.error('Erreur Create', err)
      });
    }
  }

  deleteStore(id: string, name: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le magasin "${name}" ?`)) {
      this.storeService.deleteStore(id).subscribe({
        next: () => this.loadStores(), // Rafraîchir la liste
        error: (err) => console.error('Erreur Delete', err)
      });
    }
  }
  initMap(): void {
    // Si une carte existe déjà, on la détruit pour éviter les bugs lors de la réouverture de la modale
    if (this.map) {
      this.map.remove();
    }

    // On récupère les coordonnées actuelles du formulaire, sinon on centre sur Casablanca par défaut
    const currentLat = this.storeForm.get('latitude')?.value || 33.5731;
    const currentLng = this.storeForm.get('longitude')?.value || -7.5898;

    // Initialisation de la carte (le 'map' correspond à l'id="map" dans le HTML)
    this.map = L.map('map').setView([currentLat, currentLng], 13);

    // Ajout du fond de carte (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Configuration de l'icône du marqueur
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });

    // Placement du marqueur initial
    this.marker = L.marker([currentLat, currentLng], { icon }).addTo(this.map);

    // ÉCOUTEUR DE CLIC : Quand on clique sur la carte
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // 1. Déplacer le marqueur
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      }

      // 2. Mettre à jour le formulaire Angular
      this.storeForm.patchValue({
        latitude: lat,
        longitude: lng
      });
    });
  }

  async searchAddress(query: string): Promise<void> {
    if (!query || query.trim() === '') return;

    try {
      // Appel à l'API de géocodage gratuite d'OpenStreetMap
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        // On récupère le premier résultat
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        // 1. Déplacer la carte et le marqueur
        if (this.map && this.marker) {
          const newLatLng = new L.LatLng(lat, lon);
          this.map.setView(newLatLng, 15); // Zoom de niveau 15 (plus proche)
          this.marker.setLatLng(newLatLng);
        }

        // 2. Mettre à jour le formulaire Angular
        this.storeForm.patchValue({
          latitude: lat,
          longitude: lon
        });
      } else {
        alert("Adresse introuvable. Essayez d'ajouter la ville (ex: Maarif, Casablanca).");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche d'adresse :", error);
    }
  }

  // ── Detail Panel Methods ──────────────────────────────────

  openDetail(store: StoreResponseDto): void {
    this.selectedStore = store;
    
    // If ownerName is not available, fetch it from Keycloak
    if (!store.ownerName && store.ownerId) {
      this.keycloakAdmin.getUsersByRole('STORE_OWNER').subscribe({
        next: (owners) => {
          const owner = owners.find(o => o.id === store.ownerId);
          if (owner) {
            store.ownerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.username || 'Unknown';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Failed to fetch owner name from Keycloak:', err);
          store.ownerName = 'Unknown';
        }
      });
    }
  }

  closeDetail(): void {
    this.selectedStore = null;
  }
}