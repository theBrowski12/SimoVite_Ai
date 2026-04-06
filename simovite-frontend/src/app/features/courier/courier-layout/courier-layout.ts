import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service'; // Adapte le chemin
import { KeycloakService } from '@core/auth/keycloak.service';
import { KeycloakProfile } from 'keycloak-js';

@Component({
  selector: 'app-courier-layout',
  standalone: false,
  templateUrl: './courier-layout.html',
  styleUrl: './courier-layout.scss' // Pense à déplacer le CSS de ta navbar ici !
})
export class CourierLayout implements OnInit {
  initials: string = '';
  isAdmin = false;
  isLoggedIn = false;
  userProfile: KeycloakProfile | null = null;
  

  constructor(@Inject(KeycloakService) private readonly keycloak: KeycloakService,
  private auth: AuthService,
  private router: Router,
  private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    const name = this.auth.fullName || 'Livreur';
    this.initials = name.substring(0, 2).toUpperCase();
  // On vérifie l'état
  if (!this.keycloak) {
        console.error("KeycloakService n'est pas injecté correctement");
        return;
    }

  this.isLoggedIn = await this.keycloak.isLoggedIn();
  
  if (this.isLoggedIn) {
    try {
      const roles = this.keycloak.getRoles();
      console.log("Mes rôles détectés :", roles);
      this.userProfile = await this.keycloak.loadUserProfile();
      this.isAdmin = roles.includes('ADMIN');
      this.cdr.detectChanges();
      console.log('User loaded:', this.userProfile);
    } catch (error) {
      console.error('Failed to load user profile', error);
    }
  }
}
  logout() {
    this.auth.logout(); // Assure-toi que cette méthode existe dans ton AuthService
    this.router.navigate(['/login']); // Redirige vers la page de login (adapte la route si besoin)
  }
}