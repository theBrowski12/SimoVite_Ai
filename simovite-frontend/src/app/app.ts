import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '@core/auth/keycloak.service';

@Component({
  selector: 'app-root', // 👈 Doit être identique à la balise dans index.html
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit{ // 👈 Le nom de la classe est "App"
  protected readonly title = signal('simovite-frontend');
  constructor(public router: Router ,private readonly keycloak: KeycloakService) {}

  async ngOnInit() {
    const isLoggedIn = await this.keycloak.isLoggedIn();

    if (isLoggedIn) {
      const roles = this.keycloak.getRoles().map(r => r.toUpperCase());

      // Si on est sur la page d'accueil
      if (this.router.url === '/' || this.router.url === '/home') {
        
        if (roles.includes('ADMIN')) {
          this.router.navigate(['/admin']);
        } 
        else if (roles.includes('COURIER')) {
          this.router.navigate(['/courier']); // 🌟 AJOUT POUR LE LIVREUR
        }
        else if (roles.includes('STORE_OWNER')) {
          this.router.navigate(['/owner/dashboard']);
        }
      }
    }
  }
}