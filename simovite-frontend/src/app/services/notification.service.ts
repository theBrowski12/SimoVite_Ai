import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification, ToastNotification } from '@models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notifications$ = new BehaviorSubject<Notification[]>([]);

  private toasts: ToastNotification[] = [];
  private toasts$ = new BehaviorSubject<ToastNotification[]>([]);

  constructor() {}

  // ── Notifications ──────────────────────────────────────────

  getNotifications() {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => n.status === 'unread').length;
  }

  getUnreadCount$() {
    return new BehaviorSubject<number>(this.getUnreadCount()).asObservable();
  }

  addNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(newNotification);
    this.notifications$.next([...this.notifications]);
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'read';
      this.notifications$.next([...this.notifications]);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.status = 'read');
    this.notifications$.next([...this.notifications]);
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifications$.next([...this.notifications]);
  }

  clearAll(): void {
    this.notifications = [];
    this.notifications$.next([]);
  }

  // ── Toast Notifications ────────────────────────────────────

  getToasts() {
    return this.toasts$.asObservable();
  }

  showToast(type: ToastNotification['type'], message: string, duration = 4000): void {
    const toast: ToastNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      message,
      duration
    };
    this.toasts.push(toast);
    this.toasts$.next([...this.toasts]);

    if (duration > 0) {
      setTimeout(() => this.removeToast(toast.id), duration);
    }
  }

  success(message: string): void {
    this.showToast('success', message);
  }

  error(message: string): void {
    this.showToast('error', message, 6000);
  }

  info(message: string): void {
    this.showToast('info', message);
  }

  warning(message: string): void {
    this.showToast('warning', message, 5000);
  }

  private removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toasts$.next([...this.toasts]);
  }

  dismissToast(id: string): void {
    this.removeToast(id);
  }

  // ── Helper: Order Notifications ────────────────────────────

  notifyOrderCreated(orderRef: string): void {
    this.addNotification({
      type: 'order',
      icon: '📦',
      title: 'New Order',
      message: `Order ${orderRef} has been placed successfully.`
    });
  }

  notifyOrderStatusChanged(orderRef: string, status: string): void {
    this.addNotification({
      type: 'order',
      icon: '🔄',
      title: 'Order Updated',
      message: `Order ${orderRef} status changed to ${status}.`
    });
  }

  notifyDeliveryAssigned(orderRef: string): void {
    this.addNotification({
      type: 'delivery',
      icon: '🚚',
      title: 'Delivery Assigned',
      message: `You have been assigned to deliver order ${orderRef}.`
    });
  }

  notifyDeliveryCompleted(orderRef: string): void {
    this.addNotification({
      type: 'delivery',
      icon: '✅',
      title: 'Delivery Completed',
      message: `Order ${orderRef} has been delivered successfully.`
    });
  }

  notifyNewReview(rating: number): void {
    const stars = '⭐'.repeat(Math.min(rating, 5));
    this.addNotification({
      type: 'review',
      icon: '⭐',
      title: 'New Review',
      message: `You received a ${rating}-star review! ${stars}`
    });
  }

  notifyPromotion(productName: string, discount: number): void {
    this.addNotification({
      type: 'promo',
      icon: '🏷️',
      title: 'Special Offer',
      message: `${productName} is now ${discount}% off!`
    });
  }

  notifySystem(message: string): void {
    this.addNotification({
      type: 'system',
      icon: 'ℹ️',
      title: 'System Notification',
      message
    });
  }
}
