import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private keycloak: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // 1. On ignore UNIQUEMENT les fichiers de traduction et les appels de login/token de Keycloak
    if (req.url.includes('/assets/i18n/') || req.url.includes('/protocol/openid-connect/')) {
      return next.handle(req);
    }

    // 2. Si l'utilisateur n'est PAS connecté, on passe la requête sans token
    if (!this.keycloak.isLoggedIn()) {
      return next.handle(req);
    }

    // 3. Si connecté, on ajoute le token (avec refresh si nécessaire)
    return from(this.keycloak.refreshToken()).pipe(
      switchMap(token => {
        if (token) {
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(cloned);
        }
        return next.handle(req);
      })
    );
  }
}
