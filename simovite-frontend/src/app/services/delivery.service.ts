// services/delivery.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Delivery, VehicleType, DeliveryStatus, DistancePreviewDto } from '../models/delivery.model';
import { CourierLocationRequest } from '@models/DistancePreviewDto';

@Injectable({ providedIn: 'root' })
export class DeliveryService {

  private base = `${environment.apiGateway}/DELIVERY-SERVICE/v1/deliveries`;

  constructor(private http: HttpClient) {}

  // ── OWNER ─────────────────────────────────────────────────

  getByStoreId(storeId: string): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.base}/store/${storeId}`);
  }

  // ── ADMIN ─────────────────────────────────────────────────

  getAll(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.base}/all`);
  }

  getById(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.base}/${id}`);
  }

  getByOrderRef(ref: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.base}/order/${ref}`);
  }

  updateStatus(id: number, status: DeliveryStatus): Observable<Delivery> {
    return this.http.put<Delivery>(
      `${this.base}/${id}/status`,
      null,
      { params: new HttpParams().set('status', status) }
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ── COURIER ───────────────────────────────────────────────

  getPending(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.base}/pending`);
  }

  getMine(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.base}/my-deliveries`);
  }

  accept(id: number, vehicleType: VehicleType, lat: number, lng: number): Observable<Delivery> {
    return this.http.put<Delivery>(
      `${this.base}/${id}/accept`,
      { latitude: lat, longitude: lng }, 
      { params: new HttpParams().set('vehicleType', vehicleType) }
    );
  }

  complete(id: number): Observable<Delivery> {
    return this.http.put<Delivery>(`${this.base}/${id}/complete`, null);
  }

  updateCourierLocation(lat: number, lng: number): Observable<void> {
    return this.http.post<void>(
      `${this.base}/courier/location`,
      { latitude: lat, longitude: lng }
    );
  }
  previewDistance(id: number, vehicleType: VehicleType, location: CourierLocationRequest): Observable<DistancePreviewDto> {
    const params = new HttpParams().set('vehicleType', vehicleType);
    return this.http.post<DistancePreviewDto>( // POST ou PUT selon ton Controller
      `${this.base}/${id}/preview`,
      location,
      { params }
    );
  }
  // After trackByOrderRef
  

  // ── CLIENT ────────────────────────────────────────────────

  trackByOrderRef(ref: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.base}/track/${ref}`);
  }
}