import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, forkJoin, switchMap } from 'rxjs';
import { KeycloakService } from '@core/auth/keycloak.service';

@Injectable({
  providedIn: 'root'
})
export class KeycloakAdminService {

  private kcAdminUrl = 'http://localhost:8080/admin/realms/Simovite';

  constructor(private http: HttpClient, private keycloakService: KeycloakService) { }

  // Une seule méthode qui récupère le token PUIS lance les 3 requêtes
  getAllAdminData(): Observable<any> {
    return from(this.keycloakService.getToken()).pipe(
      switchMap(token => {
        // 1. On crée les headers une seule fois
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        });

        // 2. On lance les 3 requêtes en parallèle avec les mêmes headers
        return forkJoin({
          realmInfo: this.http.get<any>(this.kcAdminUrl, { headers }),
          usersCount: this.http.get<number>(`${this.kcAdminUrl}/users/count`, { headers }),
          rolesList: this.http.get<any[]>(`${this.kcAdminUrl}/roles`, { headers })
        });
      })
    );
  }
}