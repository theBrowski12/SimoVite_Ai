// core/auth/keycloak.service.ts
import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {

  private keycloak!: Keycloak;

  async init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url:      environment.keycloak.url,
      realm:    environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    });

    return this.keycloak.init({
      onLoad:       'check-sso',
      checkLoginIframe: false
    });
  }

  login():  void { this.keycloak.login(); }
  logout(): void { this.keycloak.logout({ redirectUri: window.location.origin }); }

  getToken():   string  { return this.keycloak.token ?? ''; }
  isLoggedIn(): boolean { return !!this.keycloak.authenticated; }

  getRoles(): string[] {
    return this.keycloak.tokenParsed?.['realm_access']?.['roles'] ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  getUserId():   string { return this.keycloak.tokenParsed?.['sub']         ?? ''; }
  getEmail():    string { return this.keycloak.tokenParsed?.['email']        ?? ''; }
  getFullName(): string {
    const p = this.keycloak.tokenParsed;
    return `${p?.['given_name'] ?? ''} ${p?.['family_name'] ?? ''}`.trim();
  }

  async refreshToken(): Promise<string> {
    await this.keycloak.updateToken(30);
    return this.keycloak.token ?? '';
  }
}