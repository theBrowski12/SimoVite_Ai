// core/auth/keycloak.service.ts
import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '@env/environment';
import { KeycloakProfile } from 'keycloak-js';
@Injectable({ providedIn: 'root' })
export class KeycloakService {

  private keycloak!: Keycloak;

  async init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url:      environment.keycloak.url,
      realm:    environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    });
    this.keycloak.onTokenExpired = () => {
          this.keycloak.updateToken(30).catch(() => {
            console.warn('Échec du rafraîchissement automatique du token.');
            this.logout(); 
          });
        };
    return this.keycloak.init({
      onLoad:       'check-sso',
      checkLoginIframe: false
    });
  }
  
  async loadUserProfile(): Promise<KeycloakProfile> {
    return await this.keycloak.loadUserProfile();
}

  login():  void { this.keycloak.login(); }
  logout(): void { this.keycloak.logout({ redirectUri: window.location.origin }); }
  register(): void {
    this.keycloak.register();
  }
  getToken():   string  { return this.keycloak.token ?? ''; }

  isLoggedIn(): boolean {
    return this.keycloak && this.keycloak.authenticated ? true : false;
  }

  getRoles(): string[] {
    return this.keycloak.tokenParsed?.['realm_access']?.['roles'] ?? [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  getDecodedToken(): any {
    return this.keycloak?.tokenParsed || {};
  }
  getUserId():   string { return this.keycloak.tokenParsed?.['sub']         ?? ''; }
  getEmail():    string { return this.keycloak.tokenParsed?.['email']        ?? ''; }
  getFullName(): string {
    const p = this.keycloak.tokenParsed;
    return `${p?.['given_name'] ?? ''} ${p?.['family_name'] ?? ''}`.trim();
  }

  async refreshToken(): Promise<string> {
    // Si l'utilisateur n'est pas connecté, on retourne une chaîne vide sans rediriger
    if (!this.isLoggedIn()) return '';

    try {
      // Si le token expire dans moins de 30s, on le rafraîchit
      await this.keycloak.updateToken(30);
      return this.keycloak.token ?? '';
    } catch (error) {
      console.error('Token refresh failed.', error);
      // On ne redirige PAS vers login automatiquement, on laisse l'intercepteur gérer
      return '';
    }
  }
}