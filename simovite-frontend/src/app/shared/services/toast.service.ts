import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root' // <-- C'est ça qui permet l'injection dans l'intercepteur !
})
export class ToastService {
  // Le canal radio sur lequel le composant va écouter
  public toastState = new Subject<ToastMessage>();

  error(message: string) {
    this.toastState.next({ message, type: 'error' });
  }

  success(message: string) {
    this.toastState.next({ message, type: 'success' });
  }

  info(message: string) {
    this.toastState.next({ message, type: 'info' });
  }
}