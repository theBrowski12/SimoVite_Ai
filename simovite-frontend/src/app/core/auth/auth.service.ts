// core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

export type AppRole = 'CLIENT' | 'COURIER' | 'STORE_OWNER' | 'ADMIN';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private keycloak: KeycloakService,
    private router: Router
  ) {}

  get isLoggedIn(): boolean { return this.keycloak.isLoggedIn(); }
  get userId():     string  { return this.keycloak.getUserId(); }
  get email():      string  { return this.keycloak.getEmail(); }
  get fullName():   string  { return this.keycloak.getFullName(); }
  get roles():      string[] { return this.keycloak.getRoles(); }

  hasRole(role: AppRole): boolean {
    return this.keycloak.hasRole(role);
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