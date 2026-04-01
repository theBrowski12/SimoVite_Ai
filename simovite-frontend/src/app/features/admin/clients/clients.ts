import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { KeycloakAdminService } from '@services/keycloak-admin.service'; 
import { Client } from '@models/client.model'; 
import { OrderService } from '@services/order.service';
import { map, switchMap, of, catchError, forkJoin } from 'rxjs';

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

    this.keycloakAdmin.getUsers().pipe(
      // On transforme d'abord les données Keycloak en base de liste Client
      map((keycloakUsers: any[]) => {
        return keycloakUsers.map(ku => ({
          id: ku.id,
          name: `${ku.firstName || ''} ${ku.lastName || ''}`.trim() || ku.username,
          email: ku.email || 'Aucun email',
          enabled: ku.enabled ?? true,
          emailVerified: ku.emailVerified ?? false,
          joinedAt: ku.createdTimestamp ? new Date(ku.createdTimestamp).toISOString().split('T')[0] : 'Inconnu',
          totalOrders: 0,
          totalSpent: 0,
          reviewsCount: 0 // Note: Ton OrderService n'a pas de reviews, on laisse à 0
        }));
      }),
      // On utilise switchMap pour lancer les requêtes de commandes en parallèle pour chaque client
      switchMap((baseClients: Client[]) => {
        if (baseClients.length === 0) return of([]);

        const enrichmentRequests = baseClients.map(client =>
          this.orderService.getByUserId(client.id).pipe(
            map(orders => {
              // On calcule les stats pour ce client précis
              client.totalOrders = orders.length;
              client.totalSpent = orders.reduce((sum, order) => sum + (order.price || 0), 0); 
              // Remplace 'totalPrice' par le nom exact du champ dans ton Order model
              return client;
            }),
            catchError(() => of(client)) // Si l'Order-Service échoue pour un client, on garde le client avec 0
          )
        );
        return forkJoin(enrichmentRequests);
      })
    ).subscribe({
      next: (enrichedClients: Client[]) => {
        this.clients = enrichedClients;
        this.filtered = [...this.clients];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur globale lors du chargement des clients:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.filtered = this.clients.filter(c => 
      !this.searchTerm || 
      c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1;
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