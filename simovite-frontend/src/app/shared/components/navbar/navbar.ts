import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
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
  userProfile: KeycloakProfile | null = null;

  constructor(
    private readonly keycloak: KeycloakService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
  // On vérifie l'état
  this.isLoggedIn = await this.keycloak.isLoggedIn();
  
  if (this.isLoggedIn) {
    try {
      this.userProfile = await this.keycloak.loadUserProfile();
      this.cdr.detectChanges();
      console.log('User loaded:', this.userProfile);
    } catch (error) {
      console.error('Failed to load user profile', error);
    }
  }
}

  login() { this.keycloak.login(); }
  
  // 👈 Cette fonction va ouvrir la page d'inscription de Keycloak
  register() { this.keycloak.register(); } 

  logout() { this.keycloak.logout(); }
}