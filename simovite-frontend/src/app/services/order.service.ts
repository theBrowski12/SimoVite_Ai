import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private base = `${environment.apiGateway}/ORDER-SERVICE/v1/orders`;

  constructor(private http: HttpClient) {}

  // ── READ ─────────────────────────────────────────────────

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.base);
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  getByRef(ref: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/ref/${ref}`);
  }

  getByUserId(userId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/user/${userId}`);
  }

  getByStoreId(storeId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/store/${storeId}`);
  }

  // ── WRITE ────────────────────────────────────────────────

  updateStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.put<Order>(
      `${this.base}/${id}/status`,
      null,
      { params: new HttpParams().set('status', status) }
    );
  }

  updateStatusByRef(orderRef: string, status: OrderStatus): Observable<Order> {
    return this.http.put<Order>(
      `${this.base}/ref/${orderRef}/status`,
      null,
      { params: new HttpParams().set('status', status) }
    );
  }

  confirmPayment(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/pay`, null);
  }

  applyPromotion(id: number, percentage: number): Observable<Order> {
    return this.http.patch<Order>(
      `${this.base}/${id}/apply-promotion`,
      null,
      { params: new HttpParams().set('percentage', percentage.toString()) }
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}