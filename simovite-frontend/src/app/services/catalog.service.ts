// catalog.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment'; // Adapte le chemin si besoin
import { 
  CatalogRequestDto, 
  CatalogResponseDto, 
  FoodCategory, 
  PharmacyCategory, 
  PharmacyRequestDto, 
  RestaurantRequestDto,
  SpecialDeliveryRequestDto,
  SupermarketCategory,
  SupermarketRequestDto} from '../models/catalog.model'; // Adapte le chemin
// Assure-toi que le chemin pointe bien vers ton nouveau fichier

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

  // ✅ Utilisation de l'API Gateway + le nom du microservice défini dans Spring Boot
  private readonly apiUrl = `${environment.apiGateway}/CATALOG-SERVICE/v1/catalog`;

  constructor(private http: HttpClient) { }

  // ==========================================
  // CRUD DE BASE
  // ==========================================

  createOffer(requestDto: CatalogRequestDto): Observable<CatalogResponseDto> {
    return this.http.post<CatalogResponseDto>(this.apiUrl, requestDto);
  }

  toggleAvailability(id: string): Observable<CatalogResponseDto> {
    return this.http.patch<CatalogResponseDto>(`${this.apiUrl}/${id}/availability`, {});
  }

  createRestaurantItem(requestDto: RestaurantRequestDto): Observable<CatalogResponseDto> {
    return this.http.post<CatalogResponseDto>(`${this.apiUrl}/restaurant`, requestDto);
  }

  createPharmacyItem(requestDto: PharmacyRequestDto): Observable<CatalogResponseDto> {
    return this.http.post<CatalogResponseDto>(`${this.apiUrl}/pharmacy`, requestDto);
  }

  createSupermarketItem(requestDto: SupermarketRequestDto): Observable<CatalogResponseDto> {
    return this.http.post<CatalogResponseDto>(`${this.apiUrl}/supermarket`, requestDto);
  }

  createDeliveryService(requestDto: SpecialDeliveryRequestDto): Observable<CatalogResponseDto> {
    return this.http.post<CatalogResponseDto>(`${this.apiUrl}/delivery`, requestDto);
  }

  getOfferById(id: string): Observable<CatalogResponseDto> {
    return this.http.get<CatalogResponseDto>(`${this.apiUrl}/${id}`);
  }

  getAllOffers(): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(this.apiUrl);
  }

  updateOffer(id: string, requestDto: CatalogRequestDto): Observable<CatalogResponseDto> {
    return this.http.put<CatalogResponseDto>(`${this.apiUrl}/${id}`, requestDto);
  }

  deleteOffer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==========================================
  // RECHERCHES GLOBALES
  // ==========================================

  searchOffersByName(name: string): Observable<CatalogResponseDto[]> {
    let params = new HttpParams().set('name', name);
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/search`, { params });
  }

  getAvailableOffers(): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/available`);
  }

  getOffersByProviderId(storeId: string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/store/${storeId}`);
  }

  getProductsByMainType(mainType: string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/main-type/${mainType}`);
  }

  // ==========================================
  // FILTRES GLOBAUX PAR CATÉGORIE (TAGS)
  // ==========================================

  getOffersByFoodCategory(category: FoodCategory | string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/food/category/${category}`);
  }

  getOffersByPharmacyCategory(category: PharmacyCategory | string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/pharmacy/category/${category}`);
  }

  getOffersBySupermarketCategory(category: SupermarketCategory | string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/supermarket/category/${category}`);
  }

  // ==========================================
  // FILTRES PAR CATÉGORIE POUR UN MAGASIN PRÉCIS
  // ==========================================

  getStoreOffersByFoodCategory(storeId: string, category: FoodCategory | string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/store/${storeId}/food/category/${category}`);
  }

  getStoreOffersByPharmacyCategory(storeId: string, category: PharmacyCategory | string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/store/${storeId}/pharmacy/category/${category}`);
  }

  getStoreOffersBySupermarketCategory(storeId: string, category: SupermarketCategory | string): Observable<CatalogResponseDto[]> {
    return this.http.get<CatalogResponseDto[]>(`${this.apiUrl}/store/${storeId}/supermarket/category/${category}`);
  }

  // ==========================================
  // CALCULS
  // ==========================================

  calculateDeliveryPrice(id: string, distanceKm: number, weightKg: number): Observable<number> {
    let params = new HttpParams()
      .set('distanceKm', distanceKm.toString())
      .set('weightKg', weightKg.toString());

    return this.http.get<number>(`${this.apiUrl}/${id}/calculate-price`, { params });
  }
  // ==========================================
  // GESTION DES PROMOTIONS
  // ==========================================

  applyPromotion(id: string, percentage: number): Observable<CatalogResponseDto> {
    // Utilisation de HttpParams pour envoyer le pourcentage dans l'URL proprement (?percentage=X)
    let params = new HttpParams().set('percentage', percentage.toString());
    
    // On envoie un body vide {} car c'est un PATCH et les infos sont dans l'URL
    return this.http.patch<CatalogResponseDto>(`${this.apiUrl}/${id}/promotion`, {}, { params });
  }

  removePromotion(id: string): Observable<CatalogResponseDto> {
    return this.http.delete<CatalogResponseDto>(`${this.apiUrl}/${id}/promotion`);
  }
}