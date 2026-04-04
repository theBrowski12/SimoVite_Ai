import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { KeycloakService } from '../auth/keycloak.service'; // 👈 UTILISE TON FICHIER, PAS LA LIB

// core/guards/guest.guard.ts
// core/guards/guest.guard.ts
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private keycloak: KeycloakService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const loggedIn = this.keycloak.isLoggedIn();
    
    if (loggedIn) {
      const roles = this.keycloak.getRoles().map(r => r.toUpperCase());
      console.log('GuestGuard - Redirection pour les rôles :', roles);

      // 1. On définit les priorités de redirection
      if (roles.includes('ADMIN')) {
        this.router.navigate(['/admin/dashboard']);
      } 
      else if (roles.includes('COURIER')) {
        this.router.navigate(['/courier/dashboard']);
      } 
      else if (roles.includes('STORE_OWNER')) {
        this.router.navigate(['/owner/dashboard']);
      } 
      else {
        // Par défaut, si aucun rôle spécifique ou rôle CLIENT
        this.router.navigate(['/home']);
      }

      return false; // On empêche l'accès à la Landing Page puisqu'ils sont connectés
    }

    return true; // Accès autorisé à la Landing Page pour les visiteurs
  }
}