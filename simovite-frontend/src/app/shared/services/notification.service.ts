import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { v4 as uuid } from 'uuid';
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
// shared/services/notification.service.ts
@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _notifications$ = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this._notifications$.asObservable();

  push(notif: AppNotification): void {
    const current = this._notifications$.value;
    this._notifications$.next([notif, ...current]);
    // Auto-dismiss after 5s
    setTimeout(() => this.dismiss(notif.id), 5000);
  }

  success(message: string): void { this.push({ id: uuid(), type: 'success', message }); }
  error(message: string):   void { this.push({ id: uuid(), type: 'error',   message }); }
  info(message: string):    void { this.push({ id: uuid(), type: 'info',    message }); }

  dismiss(id: string): void {
    this._notifications$.next(
      this._notifications$.value.filter(n => n.id !== id)
    );
  }
}