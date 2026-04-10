// core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';

export type AppRole = 'CLIENT' | 'COURIER' | 'STORE_OWNER' | 'ADMIN';
const APP_ROLES: AppRole[] = ['CLIENT', 'COURIER', 'STORE_OWNER', 'ADMIN'];

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private keycloak: KeycloakService,
    private router: Router,
    private http: HttpClient

  ) {}

  get isLoggedIn(): boolean { return this.keycloak.isLoggedIn(); }
  get userId():     string  { return this.keycloak.getUserId(); }
  get email():      string  { return this.keycloak.getEmail(); }
  get fullName():   string  { return this.keycloak.getFullName(); }
  get roles():      string[] { return this.keycloak.getRoles(); }

  hasRole(role: AppRole): boolean {
    return this.keycloak.hasRole(role);
  }
  hasAnyAppRole(): boolean {
    return this.keycloak.getRoles()
      .some(r => APP_ROLES.includes(r.toUpperCase() as AppRole));
  }

  async initRoleIfNeeded(): Promise<void> {
    if (!this.isLoggedIn) return;

    // Already has an app role — nothing to do
    if (this.hasAnyAppRole()) return;

    // No app role yet — this is a first login after registration
    const requestedRole = this.keycloak.getRequestedRole();
    if (!requestedRole) {
      console.warn('No requested_role in token — cannot assign role.');
      return;
    }

    try {
      const token = this.keycloak.getToken();
      await firstValueFrom(
        this.http.post(
          `${environment.apiGateway}/v1/auth/assign-role`,
          {},
          { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
        )
      );
      console.log('Role assigned:', requestedRole);

      // Force token refresh so the new realm role appears in JWT
      await this.keycloak.forceTokenRefresh();
      console.log('Token refreshed — roles now:', this.keycloak.getRoles());

    } catch (err) {
      console.error('Failed to assign role:', err);
    }
  }

  redirectByRole(): void {
    if (this.hasRole('ADMIN'))       this.router.navigate(['/admin/dashboard']);
    else if (this.hasRole('COURIER'))this.router.navigate(['/courier/dashboard']);
    else if (this.hasRole('STORE_OWNER')) this.router.navigate(['/owner/dashboard']);
    else                             this.router.navigate(['/client/home']);
  }

  login():  void { this.keycloak.login(); }
  logout(): void { this.keycloak.logout(); }
}