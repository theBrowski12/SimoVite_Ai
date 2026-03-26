import { Injectable } from '@angular/core';
import { KeycloakService } from './keycloak.service';
import { jwtDecode } from 'jwt-decode'; // Tu devras faire: npm install jwt-decode

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(private keycloakService: KeycloakService) {}

  getToken(): string {
    return this.keycloakService.getToken();
  }

  getDecodedToken(): any {
    const token = this.getToken();
    if (token) {
      try {
        return jwtDecode(token);
      } catch (Error) {
        return null;
      }
    }
    return null;
  }

  isTokenExpired(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded || !decoded.exp) {
      return true;
    }
    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);
    return date.valueOf() < new Date().valueOf();
  }
}