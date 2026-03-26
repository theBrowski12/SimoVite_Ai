import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private keycloak: KeycloakService, private router: Router) {}

  async canActivate() {
    const loggedIn = await this.keycloak.isLoggedIn();
    
    if (loggedIn) {
      // Si déjà connecté, on l'envoie vers l'accueil client au lieu de la landing
      this.router.navigate(['/client/home']);
      return false;
    }
    return true; // Accès autorisé à la Landing Page
  }
}