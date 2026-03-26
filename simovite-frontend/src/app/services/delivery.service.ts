import { Injectable } from "@angular/core";
import { environment } from "@env/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { forkJoin } from "rxjs";
import { Delivery } from "@models/delivery.model";
import { switchMap, take } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";

// services/delivery.service.ts
@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private base = `${environment.apiGateway}/v1/deliveries`;

  constructor(private http: HttpClient) {}

  getPending():    Observable<Delivery[]>  { return this.http.get<Delivery[]>(`${this.base}/pending`); }
  getById(id: string): Observable<Delivery>{ return this.http.get<Delivery>(`${this.base}/${id}`); }
  getAll():        Observable<Delivery[]>  { return this.http.get<Delivery[]>(`${this.base}/all`); }
  getMine():       Observable<Delivery[]>  { return this.http.get<Delivery[]>(`${this.base}/my`); }

  accept(id: string, vehicleType: string): Observable<Delivery> {
    return this.http.put<Delivery>(
      `${this.base}/${id}/accept?vehicleType=${vehicleType}`, {}
    );
  }

  complete(id: string): Observable<Delivery> {
    return this.http.put<Delivery>(`${this.base}/${id}/complete`, {});
  }

  updateLocation(courierId: string, lat: number, lng: number): Observable<void> {
    return this.http.post<void>(`${this.base}/courier/location`, { lat, lng });
  }
}

