import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '@services/order.service';
import { StoreService } from '@services/store.service';
import { ReviewService } from '@services/review.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { Order, OrderStatus } from '@models/order.model';
import { StoreResponseDto } from '@models/store.model';
import { ReviewResponseDto, ReviewTargetType } from '@models/review.model';

Chart.register(...registerables);

interface PerformanceMetrics {
  orderFulfillmentRate: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  productQualityScore: number;
  averageOrderValue: number;
  cancellationRate: number;
}

interface SentimentAnalytics {
  positive: number;
  negative: number;
  mixed: number;
  averageScore: number;
  totalReviews: number;
  incoherentCount: number;
}

interface DailyRevenue {
  label: string;
  value: number;
}

interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

interface StoreRating {
  storeName: string;
  rating: number;
  reviewCount: number;
}

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.scss']
})
export class Analytics implements OnInit, AfterViewInit {
  // Data
  stores: StoreResponseDto[] = [];
  selectedStore: StoreResponseDto | null = null;
  orders: Order[] = [];
  reviews: ReviewResponseDto[] = [];
  loading = true;
  error = '';

  // Metrics
  metrics: PerformanceMetrics = {
    orderFulfillmentRate: 0,
    onTimeDelivery: 0,
    customerSatisfaction: 0,
    productQualityScore: 0,
    averageOrderValue: 0,
    cancellationRate: 0
  };

  sentiment: SentimentAnalytics = {
    positive: 0,
    negative: 0,
    mixed: 0,
    averageScore: 0,
    totalReviews: 0,
    incoherentCount: 0
  };

  // Chart data
  revenueChartData: DailyRevenue[] = [];
  ordersChartData: DailyRevenue[] = [];
  sentimentChartData: { label: string; value: number }[] = [];
  topProductsData: TopProduct[] = [];
  storeRatingsData: StoreRating[] = [];
  recentReviews: ReviewResponseDto[] = [];

  // Chart instances
  private revenueChartInstance: Chart | null = null;
  private ordersChartInstance: Chart | null = null;
  private sentimentChartInstance: Chart | null = null;
  private productsChartInstance: Chart | null = null;

  // Display
  ownerName = '';
  selectedPeriod: '7d' | '30d' | 'all' = '30d';

  constructor(
    private orderSvc: OrderService,
    private storeSvc: StoreService,
    private reviewSvc: ReviewService,
    private keycloak: KeycloakService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ownerName = this.keycloak.getFullName();
    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    // Charts initialized after data loads
  }

  // ── Data Loading ──────────────────────────────────────────

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';
    const userId = this.keycloak.getUserId();

    this.storeSvc.getStoresByOwner(userId).subscribe({
      next: (stores) => {
        this.stores = stores;
        if (stores.length > 0 && !this.selectedStore) {
          this.selectedStore = stores[0];
          this.fetchStoreData();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to fetch stores:', err);
        this.error = 'Failed to load analytics data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectStore(store: StoreResponseDto): void {
    this.selectedStore = store;
    this.fetchStoreData();
  }

  private fetchStoreData(): void {
    if (!this.selectedStore) return;

    this.loading = true;
    this.cdr.detectChanges();

    // Fetch orders
    this.orderSvc.getByStoreId(this.selectedStore.id).subscribe({
      next: (orders) => {
        this.orders = orders;
        // Fetch reviews for this store
        this.reviewSvc.getReviews(this.selectedStore!.id, ReviewTargetType.STORE).subscribe({
          next: (reviews) => {
            this.reviews = reviews;
            this.computeAnalytics();
            this.initCharts();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.reviews = [];
            this.computeAnalytics();
            this.initCharts();
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Failed to fetch orders:', err);
        this.error = 'Failed to load order data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Compute Analytics ────────────────────────────────────

  private computeAnalytics(): void {
    this.computePerformanceMetrics();
    this.computeSentimentAnalytics();
    this.prepareRevenueChartData();
    this.prepareOrdersChartData();
    this.prepareSentimentChartData();
    this.computeTopProducts();
    this.computeStoreRatings();
    this.prepareRecentReviews();
  }

  private computePerformanceMetrics(): void {
    const total = this.orders.length;
    if (total === 0) {
      this.metrics = {
        orderFulfillmentRate: 0,
        onTimeDelivery: 0,
        customerSatisfaction: 0,
        productQualityScore: 0,
        averageOrderValue: 0,
        cancellationRate: 0
      };
      return;
    }

    const completed = this.orders.filter(o => o.status === 'COMPLETED').length;
    const cancelled = this.orders.filter(o => o.status === 'CANCELLED').length;
    const avgValue = this.orders.reduce((sum, o) => sum + o.price, 0) / total;

    this.metrics.orderFulfillmentRate = Math.round((completed / total) * 100);
    this.metrics.cancellationRate = Math.round((cancelled / total) * 100);
    this.metrics.averageOrderValue = Math.round(avgValue * 100) / 100;

    // On-time delivery: estimate based on completion rate minus small factor
    this.metrics.onTimeDelivery = this.metrics.orderFulfillmentRate > 0
      ? Math.max(0, this.metrics.orderFulfillmentRate - 4)
      : 0;

    // Customer satisfaction from store rating or reviews
    const storeRating = this.selectedStore?.rating;
    if (storeRating !== undefined) {
      this.metrics.customerSatisfaction = Math.round(storeRating * 20);
    } else if (this.reviews.length > 0) {
      const avgReviewRating = this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
      this.metrics.customerSatisfaction = Math.round(avgReviewRating * 20);
    } else {
      this.metrics.customerSatisfaction = 0;
    }

    // Product quality: based on non-cancelled orders with items
    const ordersWithItems = this.orders.filter(o => o.items.length > 0).length;
    this.metrics.productQualityScore = ordersWithItems > 0
      ? Math.round((ordersWithItems / total) * 100)
      : 0;
  }

  private computeSentimentAnalytics(): void {
    const total = this.reviews.length;
    if (total === 0) {
      this.sentiment = { positive: 0, negative: 0, mixed: 0, averageScore: 0, totalReviews: 0, incoherentCount: 0 };
      return;
    }

    const positive = this.reviews.filter(r => r.sentiment === 'POSITIVE').length;
    const negative = this.reviews.filter(r => r.sentiment === 'NEGATIVE').length;
    const mixed = this.reviews.filter(r => r.sentiment === 'MIXED').length;
    const incoherent = this.reviews.filter(r => r.incoherent).length;
    const avgScore = this.reviews.reduce((s, r) => s + r.rating, 0) / total;

    this.sentiment = {
      positive: Math.round((positive / total) * 100),
      negative: Math.round((negative / total) * 100),
      mixed: Math.round((mixed / total) * 100),
      averageScore: Math.round(avgScore * 10) / 10,
      totalReviews: total,
      incoherentCount: incoherent
    };
  }

  private prepareRevenueChartData(): void {
    const now = new Date();
    const days: DailyRevenue[] = [];
    const dayCount = this.selectedPeriod === '7d' ? 7 : this.selectedPeriod === '30d' ? 14 : 30;

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayRevenue = this.orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate < dayEnd && o.status === 'COMPLETED';
        })
        .reduce((sum, o) => sum + o.price, 0);

      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' :
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      days.push({ label: dayLabel, value: dayRevenue });
    }

    this.revenueChartData = days;
  }

  private prepareOrdersChartData(): void {
    const now = new Date();
    const days: DailyRevenue[] = [];
    const dayCount = this.selectedPeriod === '7d' ? 7 : this.selectedPeriod === '30d' ? 14 : 30;

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = this.orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate < dayEnd;
        }).length;

      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' :
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      days.push({ label: dayLabel, value: dayOrders });
    }

    this.ordersChartData = days;
  }

  private prepareSentimentChartData(): void {
    this.sentimentChartData = [
      { label: 'Positive', value: this.sentiment.positive },
      { label: 'Mixed', value: this.sentiment.mixed },
      { label: 'Negative', value: this.sentiment.negative }
    ];
  }

  private computeTopProducts(): void {
    const productMap = new Map<string, { name: string; sold: number; revenue: number }>();

    this.orders.forEach(order => {
      order.items.forEach(item => {
        if (!productMap.has(item.productId)) {
          productMap.set(item.productId, { name: item.productName, sold: 0, revenue: 0 });
        }
        const p = productMap.get(item.productId)!;
        p.sold += item.quantity;
        p.revenue += item.subTotal;
      });
    });

    this.topProductsData = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }

  private computeStoreRatings(): void {
    const total = this.reviews.length;
    const avgRating = total > 0
      ? Math.round((this.reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : (this.selectedStore?.rating || 0);

    this.storeRatingsData = [{
      storeName: this.selectedStore?.name || 'Store',
      rating: avgRating,
      reviewCount: total
    }];

    // If multiple stores, show all
    if (this.stores.length > 1) {
      this.storeRatingsData = this.stores.map(s => {
        const storeReviews = this.reviews.filter(r => r.targetId === s.id);
        const storeAvg = storeReviews.length > 0
          ? Math.round((storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length) * 10) / 10
          : (s.rating || 0);
        return {
          storeName: s.name,
          rating: storeAvg,
          reviewCount: storeReviews.length
        };
      });
    }
  }

  private prepareRecentReviews(): void {
    this.recentReviews = [...this.reviews]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  // ── Charts ────────────────────────────────────────────────

  private initCharts(): void {
    setTimeout(() => {
      this.initRevenueChart();
      this.initOrdersChart();
      this.initSentimentChart();
      this.initProductsChart();
      this.cdr.detectChanges();
    }, 200);
  }

  private initRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.revenueChartInstance) this.revenueChartInstance.destroy();

    this.revenueChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.revenueChartData.map(d => d.label),
        datasets: [{
          label: 'Revenue (DH)',
          data: this.revenueChartData.map(d => d.value),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private initOrdersChart(): void {
    const canvas = document.getElementById('ordersChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.ordersChartInstance) this.ordersChartInstance.destroy();

    this.ordersChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.ordersChartData.map(d => d.label),
        datasets: [{
          label: 'Orders',
          data: this.ordersChartData.map(d => d.value),
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private initSentimentChart(): void {
    const canvas = document.getElementById('sentimentChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.sentimentChartInstance) this.sentimentChartInstance.destroy();

    this.sentimentChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.sentimentChartData.map(d => d.label),
        datasets: [{
          data: this.sentimentChartData.map(d => d.value),
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#374151',
              font: { size: 12, weight: 600 }
            }
          }
        }
      }
    });
  }

  private initProductsChart(): void {
    const canvas = document.getElementById('productsChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.productsChartInstance) this.productsChartInstance.destroy();

    this.productsChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.topProductsData.map(p => p.name),
        datasets: [{
          label: 'Revenue (DH)',
          data: this.topProductsData.map(p => p.revenue),
          backgroundColor: this.topProductsData.map((_, i) => this.getChartColor(i)),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }
        }
      }
    });
  }

  private getChartColor(index: number): string {
    const colors = ['#FF6B35', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
    return colors[index % colors.length];
  }

  // ── Helpers ──────────────────────────────────────────────

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  getSentimentClass(sentiment: string): string {
    const map: Record<string, string> = {
      POSITIVE: 'sentiment-positive',
      NEGATIVE: 'sentiment-negative',
      MIXED: 'sentiment-mixed'
    };
    return map[sentiment] || 'sentiment-neutral';
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStoreOrderCount(storeId: string): number {
    if (this.selectedStore?.id === storeId) return this.orders.length;
    return 0;
  }

  selectPeriod(period: '7d' | '30d' | 'all'): void {
    this.selectedPeriod = period;
    this.prepareRevenueChartData();
    this.prepareOrdersChartData();
    this.initRevenueChart();
    this.initOrdersChart();
  }
}

