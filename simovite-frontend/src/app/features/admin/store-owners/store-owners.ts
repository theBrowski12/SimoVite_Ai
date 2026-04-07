import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { KeycloakAdminService } from '@services/keycloak-admin.service';
import { StoreService } from '@services/store.service';
import { CatalogService } from '@services/catalog.service';
import { StoreResponseDto } from '@models/store.model';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

interface StoreOwner {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  isOnline: boolean;
  joinedAt: string;
  stores: StoreResponseDto[];
  totalProducts: number;
  totalRevenue: number;
  avgRating: number;
  storesOpen: number;
}

@Component({
  selector: 'app-admin-store-owners',
  standalone: false,
  templateUrl: './store-owners.html',
  styleUrls: ['./store-owners.scss']
})
export class AdminStoreOwners implements OnInit {
  owners: StoreOwner[] = [];
  filtered: StoreOwner[] = [];
  loading = true;

  searchTerm = '';
  filterStatus = '';
  currentPage = 1;
  pageSize = 10;

  constructor(
    private keycloakAdmin: KeycloakAdminService,
    private storeSvc: StoreService,
    private catalogSvc: CatalogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStoreOwners();
  }

  loadStoreOwners(): void {
    this.loading = true;

    forkJoin({
      keycloakUsers: this.keycloakAdmin.getUsersByRole('STORE_OWNER'),
      allStores: this.storeSvc.getAllStores()
    }).pipe(
      switchMap(({ keycloakUsers, allStores }) => {
        if (keycloakUsers.length === 0) return of([]);

        const ownerRequests = keycloakUsers.map(u => {
          const userStores = allStores.filter(s => s.ownerId === u.id);

          return this.keycloakAdmin.getUserSessions(u.id).pipe(
            map(sessions => {
              const storesOpen = userStores.filter(s => s.open).length;
              const avgRating = userStores.length > 0
                ? Math.round((userStores.reduce((sum, s) => sum + (s.rating || 0), 0) / userStores.length) * 10) / 10
                : 0;

              return {
                id: u.id,
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
                email: u.email || 'N/A',
                enabled: u.enabled ?? true,
                isOnline: sessions.length > 0,
                joinedAt: u.createdTimestamp ? new Date(u.createdTimestamp).toISOString().split('T')[0] : 'Unknown',
                stores: userStores,
                totalProducts: 0,
                totalRevenue: 0,
                avgRating,
                storesOpen
              } as StoreOwner;
            }),
            switchMap(owner => {
              if (owner.stores.length === 0) return of(owner);

              const productRequests = owner.stores.map(s =>
                this.catalogSvc.getOffersByProviderId(s.id).pipe(catchError(() => of([])))
              );

              return forkJoin(productRequests).pipe(
                map((productArrays: any[][]) => {
                  owner.totalProducts = productArrays.flat().length;
                  owner.totalRevenue = productArrays.flat().reduce((sum: number, p: any) => sum + (p.basePrice || 0), 0);
                  return owner;
                }),
                catchError(() => of(owner))
              );
            }),
            catchError(() => of(null))
          );
        });

        return forkJoin(ownerRequests);
      })
    ).subscribe({
      next: (data) => {
        this.owners = (data.filter(o => o !== null) as StoreOwner[]);
        this.filtered = [...this.owners];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load store owners:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.filtered = this.owners.filter(o => {
      const matchSearch = !this.searchTerm ||
        o.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        o.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        o.stores.some(s => s.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchStatus = !this.filterStatus ||
        (this.filterStatus === 'active' ? o.enabled : !o.enabled);

      return matchSearch && matchStatus;
    });
    this.currentPage = 1;
  }

  reset(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  get paginated(): StoreOwner[] {
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize) || 1;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  Math = Math;

  // ── Actions ──────────────────────────────────────────────

  toggleOwnerStatus(owner: StoreOwner): void {
    const newStatus = !owner.enabled;
    this.keycloakAdmin.updateUser(owner.id, { enabled: newStatus }).subscribe({
      next: () => {
        owner.enabled = newStatus;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to toggle owner status:', err)
    });
  }

  deleteOwner(owner: StoreOwner): void {
    if (!confirm(`Delete ${owner.name} and all their stores? This cannot be undone.`)) return;

    const deleteRequests = owner.stores.map(s =>
      this.storeSvc.deleteStore(s.id).pipe(catchError(() => of(null)))
    );

    if (deleteRequests.length === 0) {
      this.keycloakAdmin.deleteUser(owner.id).subscribe({
        next: () => {
          this.owners = this.owners.filter(o => o.id !== owner.id);
          this.applyFilters();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Failed to delete owner:', err)
      });
      return;
    }

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.keycloakAdmin.deleteUser(owner.id).subscribe({
          next: () => {
            this.owners = this.owners.filter(o => o.id !== owner.id);
            this.applyFilters();
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Failed to delete owner:', err)
        });
      },
      error: (err) => console.error('Failed to delete stores:', err)
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getCategoryClass(category: string): string {
    const m: Record<string, string> = {
      RESTAURANT: 'badge-orange',
      PHARMACY: 'badge-green',
      SUPERMARKET: 'badge-blue',
      SPECIAL_DELIVERY: 'badge-purple'
    };
    return m[category] ?? 'badge-gray';
  }

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getStoreNames(stores: StoreResponseDto[]): string {
    if (stores.length === 0) return 'No stores';
    if (stores.length === 1) return stores[0].name;
    return `${stores[0].name} +${stores.length - 1} more`;
  }
}
