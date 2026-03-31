// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  constructor() { }

  success(message: string): void {
    console.log('✅ SUCCÈS :', message);
    // Remplacer par un Toast/Snackbar (ex: SweetAlert, Material) pour une vraie app
    alert(message); 
  }

  error(message: string): void {
    console.error('❌ ERREUR :', message);
    // Remplacer par un Toast/Snackbar (ex: SweetAlert, Material) pour une vraie app
    alert(message);
  }
}