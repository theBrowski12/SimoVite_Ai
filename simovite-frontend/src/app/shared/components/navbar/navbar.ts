import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { KeycloakService } from '@core/auth/keycloak.service';
import { KeycloakProfile } from 'keycloak-js'; // 👈 Import important

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
// ... imports ...

export class Navbar implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  userProfile: KeycloakProfile | null = null;

  constructor(
    @Inject(KeycloakService) private readonly keycloak: KeycloakService, // 👈 Force l'injection
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
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

  login() { this.keycloak.login(); }
  register() { this.keycloak.register(); } 
  logout() { this.keycloak.logout(); }
}