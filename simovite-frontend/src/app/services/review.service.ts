import { Injectable } from "@angular/core";
import { environment } from "@env/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { EtaRequest ,EtaResponse } from "@models/eta.model";
import { PriceRequest, PriceResponse } from "@models/price.model";
import { Delivery } from "@models/delivery.model";
import { GpsPosition } from "@models/Gpsposition.model";
import { Review } from "@models/review.model";
import { CreateReviewDto } from "@models/review.model";

// services/review.service.ts
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private base = `${environment.apiGateway}/v1/reviews`;

  constructor(private http: HttpClient) {}

  create(dto: CreateReviewDto): Observable<Review> {
    return this.http.post<Review>(this.base, dto);
  }

  getByTarget(targetId: string, targetType: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/${targetId}/${targetType}`);
  }

  // ✅ Sentiment is returned automatically inside Review
  // No separate call needed — CatalogService handles it
}

