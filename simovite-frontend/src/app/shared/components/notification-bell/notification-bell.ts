import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '@services/notification.service';
import { Notification } from '@models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: false,
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.scss']
})
export class NotificationBell implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;

  constructor(
    private notifSvc: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notifSvc.getNotifications().subscribe(notifs => {
      this.notifications = notifs;
      this.unreadCount = notifs.filter(n => n.status === 'unread').length;
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  markAsRead(id: string): void {
    this.notifSvc.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notifSvc.markAllAsRead();
  }

  clearAll(): void {
    this.notifSvc.clearAll();
  }

  removeNotification(id: string): void {
    this.notifSvc.removeNotification(id);
  }

  navigateTo(link?: string): void {
    if (link) {
      this.router.navigate([link]);
    }
    this.closeDropdown();
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      order: '📦',
      delivery: '🚚',
      review: '⭐',
      promo: '🏷️',
      system: 'ℹ️'
    };
    return icons[type] || '🔔';
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
}
