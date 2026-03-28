import { Component, Inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  constructor(
    @Inject(AuthService) private authService: AuthService // 👈 Syntaxe forcée
  ) {}

  onLogout(): void {
    console.log('Tentative de déconnexion...');
    this.authService.logout();
  }
}