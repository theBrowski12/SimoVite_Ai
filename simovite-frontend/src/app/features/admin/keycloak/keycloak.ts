import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { KeycloakService } from '@core/auth/keycloak.service';
import { KeycloakAdminService } from '@services/keycloak-admin.service'; // Assure-toi de l'import
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface KeycloakRole { 
  name: string; 
  userCount: number; 
  description: string; 
  colorClass: string; 
}

@Component({ 
  selector: 'app-admin-keycloak', 
  standalone: false, 
  templateUrl: './keycloak.html', 
  styleUrls: ['./keycloak.scss'] 
})
export class AdminKeycloak implements OnInit {
  jwtExample = '';
  realm = 'Simovite';
  client = 'simovite-app';
  url = 'http://localhost:8080';
  tokenAlgo = 'RS256';
  totalUsers = 0; // Sera dynamique
  tokenExpiry = '5 min';
  sessionStatus = 'Active';

  roles: KeycloakRole[] = [
    { name: 'CLIENT', userCount: 0, description: 'Place orders, track deliveries, write reviews', colorClass: 'badge-orange' },
    { name: 'COURIER', userCount: 0, description: 'Accept deliveries, update location, mark delivered', colorClass: 'badge-blue' },
    { name: 'STORE_OWNER', userCount: 0, description: 'Manage products, toggle availability, view store orders', colorClass: 'badge-purple' },
    { name: 'ADMIN', userCount: 0, description: 'Full platform access, all CRUD, analytics, config', colorClass: 'badge-green' },
  ];

  constructor(
    private keycloak: KeycloakService,
    private keycloakAdmin: KeycloakAdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStats();
    this.extractTokenInfo();
  }

  private loadStats() {
    // 1. Récupérer le total global
    this.keycloakAdmin.getUsers().subscribe(users => this.totalUsers = users.length);

    // 2. Récupérer le compte par rôle en parallèle
    const roleRequests = this.roles.map(role => 
      this.keycloakAdmin.getUsersByRole(role.name).pipe(
        map(users => ({ name: role.name, count: users.length })),
        catchError(() => of({ name: role.name, count: 0 }))
      )
    );

    forkJoin(roleRequests).subscribe(results => {
      results.forEach(res => {
        const roleIndex = this.roles.findIndex(r => r.name === res.name);
        if (roleIndex !== -1) {
          this.roles[roleIndex].userCount = res.count;
        }
      });
      this.cdr.detectChanges();

    });
  }

  private extractTokenInfo() {
    const token = this.keycloak.getDecodedToken();
    if (token && Object.keys(token).length > 0) {
      this.jwtExample = JSON.stringify(token, null, 2);
      
      // Optionnel : Dynamiser l'algo et l'expiration si présent dans le token
      if (token.exp) {
        const remaining = Math.round((token.exp * 1000 - Date.now()) / 60000);
        this.tokenExpiry = remaining > 0 ? `${remaining} min` : 'Expiré';
      }
    } else {
      this.jwtExample = "// Aucun token détecté ou session expirée";
    }
  }
}