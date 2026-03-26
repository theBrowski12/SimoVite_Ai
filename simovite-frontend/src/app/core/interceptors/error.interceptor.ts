import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private auth: AuthService,
    private toastService: ToastService // ✅ On injecte le SERVICE
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        switch (err.status) {
          case 401: this.auth.login();                               break;
          case 403: this.toastService.error('Access denied');        break; // ✅ Appel du service
          case 404: this.toastService.error('Resource not found');   break;
          case 500: this.toastService.error('Server error occurred');break;
          default:  this.toastService.error(err.message);
        }
        return throwError(() => err);
      })
    );
  }
}