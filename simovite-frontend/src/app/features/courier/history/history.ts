import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DeliveryService } from '@services/delivery.service';
import { Delivery, DeliveryStatus } from '@models/delivery.model';

@Component({
  selector: 'app-history',
  standalone: false,
  templateUrl: './history.html',
  styleUrls: ['./history.scss'],
})
export class History implements OnInit {
  allDeliveries: Delivery[] = [];
  pastDeliveries: Delivery[] = [];
  isLoading = true;
  errorMessage = '';

  // Filter
  statusFilter: 'ALL' | 'DELIVERED' | 'CANCELLED' = 'ALL';

  constructor(
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  setFilter(status: 'ALL' | 'DELIVERED' | 'CANCELLED'): void {
    this.statusFilter = status;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.statusFilter === 'ALL') {
      this.pastDeliveries = [...this.allDeliveries];
    } else {
      this.pastDeliveries = this.allDeliveries.filter(d => d.status === this.statusFilter);
    }
    this.cdr.detectChanges();
  }

  private loadHistory(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.deliveryService.getMine().subscribe({
      next: (deliveries) => {
        // Only keep DELIVERED or CANCELLED
        this.allDeliveries = deliveries
          .filter(d => d.status === 'DELIVERED' || d.status === 'CANCELLED')
          .sort((a, b) => {
            // Sort by most recent date
            const dateA = new Date(a.deliveredAt || a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.deliveredAt || b.updatedAt || b.createdAt).getTime();
            return dateB - dateA; // Descending: newest first
          });

        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'historique', err);
        this.errorMessage = 'Unable to load your delivery history.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Stats helpers
  get deliveredCount(): number {
    return this.allDeliveries.filter(d => d.status === 'DELIVERED').length;
  }

  get cancelledCount(): number {
    return this.allDeliveries.filter(d => d.status === 'CANCELLED').length;
  }

  // Time comparison helpers
  isOnTime(d: Delivery): boolean {
    return !!(d.actualDeliveryTimeInMinutes && d.estimatedTimeInMinutes
      && d.actualDeliveryTimeInMinutes <= d.estimatedTimeInMinutes);
  }

  isLate(d: Delivery): boolean {
    return !!(d.actualDeliveryTimeInMinutes && d.estimatedTimeInMinutes
      && d.actualDeliveryTimeInMinutes > d.estimatedTimeInMinutes);
  }
}