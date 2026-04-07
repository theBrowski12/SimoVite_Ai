import { Component, AfterViewInit, Inject } from '@angular/core';
import { KeycloakService } from '@core/auth/keycloak.service'; // 👈 Import your Auth Service

declare var lucide: any; 

@Component({
  selector: 'app-owner-layout',
  standalone: false,
  templateUrl: './owner-layout.html',
  styleUrls: ['./owner-layout.scss']
})
export class OwnerLayout implements AfterViewInit {
  storeName = 'Pizza Palace';
  ownerEmail = 'owner@pizza.com';
  
  navItems = [
    { section: 'Overview', links: [{ label: 'Dashboard', icon: 'layout-dashboard', route: '/owner/dashboard' }] },
    { section: 'Store', links: [
      { label: 'Store Info', icon: 'settings', route: '/owner/store-info' },
      { label: 'Products', icon: 'package', route: '/owner/products' }
        ]},
    { section: 'Sales', links: [
      { label: 'Orders', icon: 'shopping-cart', route: '/owner/orders' },
      { label: 'Deliveries', icon: 'truck', route: '/owner/deliveries' }
    ]},
    { section: 'Analytics', links: [
      { label: 'Statistics', icon: 'bar-chart-3', route: '/owner/statistics' },
      { label: 'Reviews', icon: 'message-square', route: '/owner/reviews' }
    ]},
    { section: 'Settings', links: [{ label: 'Account', icon: 'lock', route: '/owner/account' }] }
  ];

  // 👈 Inject KeycloakService here
  constructor(@Inject(KeycloakService) private readonly keycloak: KeycloakService) {}

  ngAfterViewInit(): void {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  logout(): void {
    console.log('Logging out...');
    // 👈 Call the real logout logic
    this.keycloak.logout(); 
  }
}