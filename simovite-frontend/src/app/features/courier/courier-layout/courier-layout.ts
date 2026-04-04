import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service'; // Adapte le chemin

@Component({
  selector: 'app-courier-layout',
  standalone: false,
  templateUrl: './courier-layout.html',
  styleUrl: './courier-layout.scss' // Pense à déplacer le CSS de ta navbar ici !
})
export class CourierLayout implements OnInit {
  initials: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // 🌟 N'oublie pas de ramener la logique pour tes "initials" ici
    const name = this.auth.fullName || 'Livreur';
    this.initials = name.substring(0, 2).toUpperCase();
  }
  logout() {
    this.auth.logout(); // Assure-toi que cette méthode existe dans ton AuthService
    this.router.navigate(['/login']); // Redirige vers la page de login (adapte la route si besoin)
  }
}