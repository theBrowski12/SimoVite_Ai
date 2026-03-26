// core/interceptors/jwt.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private keycloak: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Skip Keycloak and i18n requests
    if (req.url.includes('/realms/') || req.url.includes('/assets/i18n/')) {
      return next.handle(req);
    }

    return from(this.keycloak.refreshToken()).pipe(
      switchMap(token => {
        const cloned = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;
        return next.handle(cloned);
      })
    );
  }
}