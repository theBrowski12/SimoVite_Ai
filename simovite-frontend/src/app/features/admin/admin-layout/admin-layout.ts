import { Component, OnInit } from '@angular/core';
import { KeycloakService } from '@core/auth/keycloak.service';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss'],
})
export class AdminLayout implements OnInit {
  adminName = '';
  adminEmail = '';
  adminInitials = '';
  greeting = '';
  isSearching = false;
  searchTerm = '';
  isViewOpen = false;

  constructor(
    private keycloak: KeycloakService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.adminName = this.keycloak.getFullName();
    this.adminEmail = this.keycloak.getEmail();
    this.adminInitials = this.getInitials(this.adminName);
    this.updateGreeting();
  }

  private getInitials(name: string): string {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private updateGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.auth.logout();
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    // Global search can be implemented here
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
  openView(path: string): void {
    this.isViewOpen = false;
    window.open(path, '_blank');
  }
  
}
