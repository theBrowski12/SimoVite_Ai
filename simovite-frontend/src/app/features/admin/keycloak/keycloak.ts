import { Component, Inject, OnInit } from '@angular/core';
import { KeycloakService } from '@core/auth/keycloak.service';

interface KeycloakRole { name:string; userCount:number; description:string; colorClass:string; }

@Component({ 
  selector:'app-admin-keycloak', 
  standalone:false, 
  templateUrl:'./keycloak.html', 
  styleUrls:['./keycloak.scss'] })

export class AdminKeycloak implements OnInit {
  jwtExample = '';
  constructor(@Inject(KeycloakService) private keycloak: KeycloakService) {}
  realm   = 'Simovite';
  client  = 'simovite-app';
  url     = 'http://localhost:8080';
  tokenAlgo = 'RS256';
  totalUsers = 1312;
  tokenExpiry = '5 min';
  sessionStatus = 'Active';
  roles:KeycloakRole[]=[
    { name:'CLIENT',      userCount:1284, description:'Place orders, track deliveries, write reviews', colorClass:'badge-orange' },
    { name:'COURIER',     userCount:18,   description:'Accept deliveries, update location, mark delivered', colorClass:'badge-blue' },
    { name:'STORE_OWNER', userCount:24,   description:'Manage products, toggle availability, view store orders', colorClass:'badge-purple' },
    { name:'ADMIN',       userCount:3,    description:'Full platform access, all CRUD, analytics, config', colorClass:'badge-green' },
  ];
  // admin/keycloak/admin-keycloak.ts
  async ngOnInit() {
    const token = this.keycloak.getDecodedToken();
    
    if (token && Object.keys(token).length > 0) {
      this.jwtExample = JSON.stringify(token, null, 2);
    } else {
      this.jwtExample = "// Aucun token détecté ou session expirée";
    }
  }
}
