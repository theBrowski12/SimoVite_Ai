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
    // 1. On vérifie si l'utilisateur est connecté
    const isLoggedIn = await this.keycloak.isLoggedIn();

    if (isLoggedIn) {
      // 2. On récupère les rôles
      const roles = this.keycloak.getRoles();

      // 3. Si on est sur la page d'accueil (ou la racine) et qu'on est ADMIN
      // On évite de rediriger si l'utilisateur est déjà sur une page spécifique
      if (this.router.url === '/' || this.router.url === '/home') {
        if (roles.includes('ADMIN')) {
          this.router.navigate(['/admin']);
        }
      }
    }
  }
}