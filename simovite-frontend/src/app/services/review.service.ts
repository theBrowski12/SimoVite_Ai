// review.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment'; // Adapte le chemin
import { ReviewRequestDto, ReviewResponseDto, ReviewTargetType } from '../models/review.model'; // Adapte le chemin

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private readonly apiUrl = `${environment.apiGateway}/v1/reviews`;

  constructor(private http: HttpClient) { }

  addReview(dto: ReviewRequestDto): Observable<ReviewResponseDto> {
    return this.http.post<ReviewResponseDto>(this.apiUrl, dto);
  }

  updateReview(reviewId: string, dto: ReviewRequestDto): Observable<ReviewResponseDto> {
    return this.http.put<ReviewResponseDto>(`${this.apiUrl}/${reviewId}`, dto);
  }

  getReviews(targetId?: string, targetType?: ReviewTargetType): Observable<ReviewResponseDto[]> {
    let params = new HttpParams();
    
    // Ajoute les paramètres de requête uniquement s'ils sont fournis
    if (targetId) {
      params = params.set('targetId', targetId);
    }
    if (targetType) {
      params = params.set('targetType', targetType);
    }

    return this.http.get<ReviewResponseDto[]>(this.apiUrl, { params });
  }

  getAverageRating(targetId: string, targetType: ReviewTargetType): Observable<number> {
    let params = new HttpParams()
      .set('targetId', targetId)
      .set('targetType', targetType);

    return this.http.get<number>(`${this.apiUrl}/rating`, { params });
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}