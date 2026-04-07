import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { KeycloakAdminService } from '@services/keycloak-admin.service'; 
import { Client } from '@models/client.model'; 
import { OrderService } from '@services/order.service';
import { map, switchMap, of, catchError, forkJoin } from 'rxjs';
import { is } from 'date-fns/locale';

@Component({ 
  selector: 'app-admin-clients',
  standalone: false, 
  templateUrl: './clients.html', 
  styleUrls: ['./clients.scss'] 
})
export class AdminClientsComponent implements OnInit {
  clients: Client[] = []; 
  filtered: Client[] = [];
  loading = true; 
  searchTerm = '';
  filterStatus = '';
  currentPage = 1;
  pageSize = 10;
  
  constructor(
    private keycloakAdmin: KeycloakAdminService,
    private cdr: ChangeDetectorRef,
    private orderService: OrderService, // 👈 Injection
  ) {}

  ngOnInit(): void { 
    this.loadRealClients();
  }

  loadRealClients(): void {
    this.loading = true;

    // Fetch only users with CLIENT role, like couriers uses getCOURIER()
    forkJoin({
      keycloakUsers: this.keycloakAdmin.getUsersByRole('CLIENT'),
      allOrders: this.orderService.getAll()
    }).pipe(
      switchMap(({ keycloakUsers, allOrders }) => {
        if (keycloakUsers.length === 0) return of([]);

        const clientRequests = keycloakUsers.map(u =>
          this.keycloakAdmin.getUserSessions(u.id).pipe(
            map(sessions => {
              const myOrders = allOrders.filter(o => o.userId === u.id);
              const completed = myOrders.filter(o => o.status === 'COMPLETED').length;

              return {
                id: u.id,
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
                email: u.email || 'N/A',
                enabled: u.enabled ?? true,
                emailVerified: u.emailVerified ?? false,
                isOnline: sessions.length > 0,
                joinedAt: u.createdTimestamp ? new Date(u.createdTimestamp).toISOString().split('T')[0] : 'Unknown',
                totalOrders: myOrders.length,
                totalSpent: myOrders.reduce((sum, order) => sum + (order.price || 0), 0),
                reviewsCount: 0
              };
            }),
            catchError(() => of(null))
          )
        );
        return forkJoin(clientRequests);
      })
    ).subscribe({
      next: (data) => {
        this.clients = (data.filter(c => c !== null) as Client[]);
        this.filtered = [...this.clients];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load clients:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.filtered = this.clients.filter(c => {
      const matchSearch = !this.searchTerm ||
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchStatus = !this.filterStatus ||
        (this.filterStatus === 'active' ? c.enabled : !c.enabled);

      return matchSearch && matchStatus;
    });
    this.currentPage = 1;
  }

  reset(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  get paginated(): Client[] { 
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); 
  }
  
  get totalPages(): number { 
    return Math.ceil(this.filtered.length / this.pageSize) || 1; 
  }
  
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  Math = Math;

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); 
  }

toggleClientStatus(client: Client): void {
  const newStatus = !client.enabled;
  
  // On met à jour Keycloak
  this.keycloakAdmin.updateUser(client.id, { enabled: newStatus }).subscribe({
    next: () => {
      client.enabled = newStatus; // Mise à jour locale pour éviter de tout recharger
      this.cdr.detectChanges();
    },
    error: (err) => console.error("Erreur lors du changement de statut", err)
  });
}

deleteClient(client: Client): void {
  if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${client.name} ?`)) {
    this.keycloakAdmin.deleteUser(client.id).subscribe({
      next: () => {
        // On retire le client de la liste locale
        this.clients = this.clients.filter(c => c.id !== client.id);
        this.applyFilters(); // Rafraîchit le tableau filtré
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Erreur lors de la suppression", err)
    });
  }
}
}