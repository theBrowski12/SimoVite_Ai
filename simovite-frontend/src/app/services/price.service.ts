import { Injectable } from "@angular/core";
import { environment } from "@env/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { PriceRequest, PriceResponse } from "@models/price.model";
import { EtaRequest, EtaResponse } from "@models/eta.model";
import { Delivery } from "@models/delivery.model";
import { CreateReviewDto, Review } from "@models/review.model";
// services/price.service.ts
@Injectable({ providedIn: 'root' })
export class PriceService {
  private base = `${environment.apiGateway}/api/price`;

  constructor(private http: HttpClient) {}

  calculate(req: PriceRequest): Observable<PriceResponse> {
    return this.http.post<PriceResponse>(`${this.base}/calculate`, req);
  }
}
;

