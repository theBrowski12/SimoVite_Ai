// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PricingConfig {
  baseCost:       number;
  perKm:          number;
  rushSurcharge:  number;
  nightDiscount:  number;
}

export interface ServiceHealth {
  name:   string;
  port:   string;
  status: 'UP' | 'DOWN';
}

export interface KafkaTopic {
  name:      string;
  partitions: number;
  messages:  number;
}

export interface EmailConfig {
  host: string;
  port: string;
  sender: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  
  // 1. Pour les Prix (Dirigé vers Order-Service)
private pricingBaseUrl = `${environment.apiGateway}/ORDER-SERVICE/v1/orders/admin/config`;  
  // 2. Pour la Santé (Géré par la Gateway)
private healthBaseUrl = `${environment.apiGateway}/v1/admin`;

private notificationAdminUrl = `${environment.apiGateway}/NOTIFICATION-SERVICE/v1/admin`;

  constructor(private http: HttpClient) {}

  getPricing(): Observable<PricingConfig> {
    // Va appeler : http://localhost:8888/v1/orders/admin/config/pricing
    return this.http.get<PricingConfig>(`${this.pricingBaseUrl}/pricing`);
  }

  savePricing(config: PricingConfig): Observable<PricingConfig> {
    return this.http.put<PricingConfig>(`${this.pricingBaseUrl}/pricing`, config);
  }

  getServicesHealth(): Observable<ServiceHealth[]> {
    // Va appeler : http://localhost:8888/v1/admin/health
    return this.http.get<ServiceHealth[]>(`${this.healthBaseUrl}/health`);
  }

  getEmailConfig(): Observable<EmailConfig> {
    // Appelle http://localhost:8888/notification-service/v1/admin/email-config
    return this.http.get<EmailConfig>(`${this.notificationAdminUrl}/email-config`);
  }
}