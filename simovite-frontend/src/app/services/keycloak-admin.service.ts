import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({ 
  providedIn: 'root' 
})
export class KeycloakAdminService {

  // URL de base propre utilisant tes variables d'environnement
  private kcAdminUrl = `${environment.keycloak.url}/admin/realms/${environment.keycloak.realm}`;

  constructor(private http: HttpClient) {}

  // ==========================================
  // 1. Pour la page de Liste des Clients
  // ==========================================
  getUsers(): Observable<any[]> {
    // Le token est ajouté automatiquement par AuthInterceptor
    return this.http.get<any[]>(`${this.kcAdminUrl}/users`);
  }

  // ==========================================
  // 2. Pour la page Dashboard (Statistiques)
  // ==========================================
  getAllAdminData(): Observable<any> {
    // Grâce à l'intercepteur, le code devient ultra simple. 
    // Plus besoin de from(), switchMap() ou HttpHeaders() manuels !
    return forkJoin({
      realmInfo: this.http.get<any>(this.kcAdminUrl),
      usersCount: this.http.get<number>(`${this.kcAdminUrl}/users/count`),
      rolesList: this.http.get<any[]>(`${this.kcAdminUrl}/roles`)
    });
  }

  deleteUser(id: string): Observable<void> {
  return this.http.delete<void>(`${this.kcAdminUrl}/users/${id}`);
}

updateUser(id: string, data: any): Observable<void> {
  // Keycloak utilise PUT pour les mises à jour partielles ou totales
  return this.http.put<void>(`${this.kcAdminUrl}/users/${id}`, data);
}
getUsersByRole(roleName: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.kcAdminUrl}/roles/${roleName}/users`);
}
getUserSessions(id: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.kcAdminUrl}/users/${id}/sessions`);
}
  
}