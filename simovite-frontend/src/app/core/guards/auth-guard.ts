// core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { KeycloakService } from '../auth/keycloak.service'; // 👈 UTILISE TON FICHIER, PAS LA LIB

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private publicRoutes = ['/home', '/login', '/register', '/forgot-password'];

  constructor(
    private keycloak: KeycloakService, 
    private router: Router
  ) {}


  async canActivate(): Promise<boolean> {
    // Ton service utilise une méthode simple, pas besoin de await ici 
    // car l'init se fait au démarrage de l'app (APP_INITIALIZER)
    const loggedIn = this.keycloak.isLoggedIn(); 
    
    if (loggedIn) {
      return true;
    }

    // Si pas connecté, Keycloak redirige vers la page de login
    this.keycloak.login();
    return false;
  }
}