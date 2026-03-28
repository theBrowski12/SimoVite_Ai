import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StoreService {
  // Remplace l'URL par ton vrai endpoint plus tard
  private apiUrl = 'api/stores'; 

  constructor(private http: HttpClient) {}

  getStores(): Observable<any[]> {
    // Pour l'instant on peut retourner un tableau vide pour éviter l'erreur
    return of([]); 
  }
}