// store.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment'; // Adapte le chemin
import { StoreRequestDto, StoreResponseDto } from '../models/store.model'; // Adapte le chemin
import { MainCategory } from '../models/store.model'; // Adapte le chemin
import { fr } from 'date-fns/locale';
@Injectable({
  providedIn: 'root'
})
export class StoreService {

  private readonly apiUrl = `${environment.apiGateway}/CATALOG-SERVICE/v1/stores`;

  constructor(private http: HttpClient) { }

  // ==========================================
  // CRUD BASIQUE
  // ==========================================

  createStore(requestDto: StoreRequestDto): Observable<StoreResponseDto> {
    return this.http.post<StoreResponseDto>(this.apiUrl, requestDto);
  }

  getStoreById(id: string): Observable<StoreResponseDto> {
    return this.http.get<StoreResponseDto>(`${this.apiUrl}/${id}`);
  }

  getAllStores(): Observable<StoreResponseDto[]> {
    return this.http.get<StoreResponseDto[]>(this.apiUrl);
  }

  updateStore(id: string, requestDto: StoreRequestDto): Observable<StoreResponseDto> {
    return this.http.put<StoreResponseDto>(`${this.apiUrl}/${id}`, requestDto);
  }

  deleteStore(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // RECHERCHES SPÉCIFIQUES
  // ==========================================

  getStoreByName(name: string): Observable<StoreResponseDto[]> {
    let params = new HttpParams().set('name', name);
    return this.http.get<StoreResponseDto[]>(`${this.apiUrl}/search`, { params });
  }

  getStoresByOwner(ownerId: string): Observable<StoreResponseDto[]> {
    return this.http.get<StoreResponseDto[]>(`${this.apiUrl}/owner/${ownerId}`);
  }

  getStoresByCategory(category: MainCategory): Observable<StoreResponseDto[]> {
    return this.http.get<StoreResponseDto[]>(`${this.apiUrl}/category/${category}`);
  }

  getOpenStores(): Observable<StoreResponseDto[]> {
    return this.http.get<StoreResponseDto[]>(`${this.apiUrl}/open`);
  }
}