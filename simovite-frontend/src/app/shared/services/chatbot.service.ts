// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id:        string;
  role:      'user' | 'bot';
  content:   string;
  timestamp: Date;
  loading?:  boolean;
}

export interface ChatRequest  { message: string; sessionId: string; }
export interface ChatResponse { reply: string;   sessionId: string; }

@Injectable({ providedIn: 'root' })
export class ChatService {
// Remplace SIMOVITEAI_CHATBOT par simoviteai-chatbot
// On utilise le tiret normal ici !
  private base = `${environment.apiGateway}/SIMOVITEAI-CHATBOT/v1/chat`;
  constructor(private http: HttpClient) {}

  send(req: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.base, req);
  }
}