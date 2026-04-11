import { Component, OnInit } from '@angular/core';
import { NotificationService } from '@services/notification.service';
import { ToastNotification } from '@models/notification.model';

@Component({
  selector: 'app-toast-container',
  standalone: false,
  templateUrl: './toast-container.html',
  styleUrls: ['./toast-container.scss']
})
export class ToastContainer implements OnInit {
  toasts: ToastNotification[] = [];

  constructor(private notifSvc: NotificationService) {}

  ngOnInit(): void {
    this.notifSvc.getToasts().subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type] || 'ℹ';
  }

  dismiss(id: string): void {
    this.notifSvc.dismissToast(id);
  }
}
