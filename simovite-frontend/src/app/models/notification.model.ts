// notification.model.ts
export type NotificationType = 'order' | 'delivery' | 'review' | 'system' | 'promo';
export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  icon: string;
  link?: string;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // ms, 0 = stays until dismissed
}
