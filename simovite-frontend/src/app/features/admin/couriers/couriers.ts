import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { KeycloakAdminService } from '@services/keycloak-admin.service';
import { DeliveryService } from '@services/delivery.service';
import { Courier } from '@models/courrier.model';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-couriers',
  standalone: false,
  templateUrl: './couriers.html',
  styleUrl: './couriers.scss',
})
export class AdminCouriers implements OnInit {
  couriers: Courier[] = [];
  filtered: Courier[] = [];
  loading = true;
  
  // Filtres
  filterStatus = '';
  filterVehicle = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  constructor(
    private keycloakAdmin: KeycloakAdminService,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRealData();
  }

  // admin-couriers.component.ts (Extrait de loadRealData)

loadRealData(): void {
  this.loading = true;

  forkJoin({
    keycloakUsers: this.keycloakAdmin.getUsersByRole('COURIER'),
    allDeliveries: this.deliveryService.getAll()
  }).pipe(
    switchMap(({ keycloakUsers, allDeliveries }) => {
      // Pour chaque utilisateur, on crée une requête pour ses sessions
      const courierRequests = keycloakUsers.map(u => 
        this.keycloakAdmin.getUserSessions(u.id).pipe(
          map(sessions => {
            const myDeliveries = allDeliveries.filter(d => d.courierId === u.id);
            const completed = myDeliveries.filter(d => d.status === 'DELIVERED').length;
            
            return {
              id: u.id,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
              email: u.email,
              vehicleType: (u.attributes?.vehicleType ? u.attributes.vehicleType[0] : 'MOTORCYCLE') as any,
              enabled: u.enabled ?? true,

              // 🌟 LA CORRECTION EST ICI :
              // S'il y a au moins une session active, il est ONLINE
              online: sessions.length > 0,
              
              lastSeen: sessions.length > 0 ? 'Maintenant' : (u.attributes?.lastSeen ? u.attributes.lastSeen[0] : 'Hors ligne'),
              totalDeliveries: myDeliveries.length,
              completionRate: myDeliveries.length > 0 ? Math.round((completed / myDeliveries.length) * 100) : 100,
              rating: 4.5,
              earnings: myDeliveries.reduce((acc, d) => acc + (d.deliveryCost || 0), 0)
            };
          }),
          catchError(() => of(null)) // Sécurité
        )
      );
      return forkJoin(courierRequests);
    })
  ).subscribe({
    next: (data) => {
      // On filtre les nuls au cas où
      this.couriers = data.filter(c => c !== null) as Courier[];
      this.applyFilters();
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  applyFilters(): void {
    this.filtered = this.couriers.filter(c =>
      (!this.filterStatus || (this.filterStatus === 'online' ? c.online : !c.online)) &&
      (!this.filterVehicle || c.vehicleType === this.filterVehicle) &&
      (!this.searchTerm || c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || c.email.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.currentPage = 1;
  }

  get paginated(): Courier[] {
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize) || 1;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  Math = Math;

  getVehicleClass(v: string): string {
    const m: any = { MOTORCYCLE: 'badge-orange', CAR: 'badge-blue', BICYCLE: 'badge-purple', TRUCK: 'badge-gray' };
    return m[v] || 'badge-gray';
  }

  getVehicleIcon(v: string): string {
    const m: any = { MOTORCYCLE: '🛵', CAR: '🚗', BICYCLE: '🚲', TRUCK: '🚛' };
    return m[v] || '🛵';
  }

  getInitials(name: string): string {
    if(!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }


  // ── Actions ──────────────────────────────────────────────

  toggleCourierStatus(courier: Courier): void {
    const newStatus = !courier.enabled;
    this.keycloakAdmin.updateUser(courier.id, { enabled: newStatus }).subscribe({
      next: () => {
        courier.enabled = newStatus;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to toggle courier status:', err)
    });
  }

  deleteCourier(courier: Courier): void {
    if (!confirm(`Delete ${courier.name}? This cannot be undone.`)) return;
    this.keycloakAdmin.deleteUser(courier.id).subscribe({
      next: () => {
        this.couriers = this.couriers.filter(c => c.id !== courier.id);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to delete courier:', err)
    });
  }

  reset(): void {
    this.filterStatus = ''; this.filterVehicle = ''; this.searchTerm = '';
    this.applyFilters();
  }
}