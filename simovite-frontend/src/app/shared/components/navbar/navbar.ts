import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router'; // 👈 Import Router
import { filter } from 'rxjs/operators'; // 👈 Import filter
import { KeycloakService } from '@core/auth/keycloak.service';
import { KeycloakProfile } from 'keycloak-js';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  userProfile: KeycloakProfile | null = null;
  
  showNavbar = true; // 👈 Add this flag

  constructor(
    @Inject(KeycloakService) private readonly keycloak: KeycloakService,
    private cdr: ChangeDetectorRef,
    private router: Router // 👈 Inject the Router
  ) {
    // 👈 Listen to URL changes to show/hide the navbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      // Hide the navbar if the URL belongs to these specific layouts
      this.showNavbar = !(
        url.startsWith('/owner') || 
        url.startsWith('/admin') || 
        url.startsWith('/courier')
      );
    });
  }

  async ngOnInit() {
    if (!this.keycloak) {
        console.error("KeycloakService n'est pas injecté correctement");
        return;
    }

    this.isLoggedIn = await this.keycloak.isLoggedIn();
  
    if (this.isLoggedIn) {
      try {
        const roles = this.keycloak.getRoles();
        this.userProfile = await this.keycloak.loadUserProfile();
        this.isAdmin = roles.includes('ADMIN');
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    }
  }

  login() { this.keycloak.login(); }
  register() { this.keycloak.register(); } 
  logout() { this.keycloak.logout(); }
}