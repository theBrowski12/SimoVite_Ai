// services/eta.service.ts
import { Injectable } from "@angular/core";
import { environment } from "@env/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { EtaResponse } from "@models/eta.model";
import { EtaRequest  } from "@models/eta.model";
@Injectable({ providedIn: 'root' })
export class EtaService {
  private base = `${environment.apiGateway}/ETA-SERVICE/v1/eta`;

  constructor(private http: HttpClient) {}

  calculate(req: EtaRequest): Observable<EtaResponse> {
    return this.http.post<EtaResponse>(`${this.base}/calculate`, req);
  }
}

