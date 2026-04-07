import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '@services/order.service';
import { DeliveryService } from '@services/delivery.service';
import { ReviewService } from '@services/review.service';
import { StoreService } from '@services/store.service';
import { Order, OrderStatus } from '@models/order.model';
import { Delivery, DeliveryStatus } from '@models/delivery.model';
import { ReviewResponseDto } from '@models/review.model';
import { StoreResponseDto } from '@models/store.model';

Chart.register(...registerables);

interface DailyData { label: string; value: number; value2?: number; }
interface CategoryData { label: string; value: number; }

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class AdminDashboard implements OnInit, AfterViewInit {
  today: Date = new Date();
  loading = true;

  // Real data
  orders: Order[] = [];
  deliveries: Delivery[] = [];
  reviews: ReviewResponseDto[] = [];
  stores: StoreResponseDto[] = [];

  // Chart data
  ordersTimeData: DailyData[] = [];
  categoryData: CategoryData[] = [];
  revenueData: DailyData[] = [];

  // Computed stats
  totalOrders = 0;
  activeDeliveries = 0;
  todayRevenue = 0;
  avgETA = 0;

  // Chart instances
  private ordersChart: Chart | null = null;
  private categoryChart: Chart | null = null;
  private revenueChart: Chart | null = null;

  constructor(
    private orderSvc: OrderService,
    private deliverySvc: DeliveryService,
    private reviewSvc: ReviewService,
    private storeSvc: StoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Charts init after data loads
  }

  // ── Load All Data ──────────────────────────────────────────
  loadData(): void {
    this.loading = true;

    // Fetch all data in parallel
    Promise.all([
      this.orderSvc.getAll().toPromise(),
      this.deliverySvc.getAll().toPromise(),
      this.reviewSvc.getReviews().toPromise(),
      this.storeSvc.getAllStores().toPromise()
    ]).then(([orders, deliveries, reviews, stores]) => {
      this.orders = orders || [];
      this.deliveries = deliveries || [];
      this.reviews = reviews || [];
      this.stores = stores || [];

      this.computeStats();
      this.prepareChartData();
      this.loading = false;
      this.cdr.detectChanges();

      // Init charts after data is ready
      setTimeout(() => {
        this.initOrdersChart();
        this.initCategoryChart();
        this.initRevenueChart();
        this.cdr.detectChanges();
      }, 200);
    }).catch(err => {
      console.error('Dashboard load failed:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  // ── Compute Stats ──────────────────────────────────────────
  computeStats(): void {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // Total orders today
    this.totalOrders = this.orders.filter(o =>
      new Date(o.createdAt) >= todayStart
    ).length;

    // Active deliveries (PENDING, ASSIGNED, PICKED_UP)
    this.activeDeliveries = this.deliveries.filter(d =>
      d.status === 'PENDING' || d.status === 'ASSIGNED' || d.status === 'PICKED_UP'
    ).length;

    // Today's revenue (completed orders)
    this.todayRevenue = this.orders
      .filter(o => new Date(o.createdAt) >= todayStart && o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.price, 0);

    // Average ETA from deliveries with estimates
    const etas = this.deliveries
      .filter(d => d.estimatedTimeInMinutes && d.estimatedTimeInMinutes > 0)
      .map(d => d.estimatedTimeInMinutes!);
    this.avgETA = etas.length > 0
      ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length)
      : 0;
  }

  // ── Prepare Chart Data ─────────────────────────────────────
  prepareChartData(): void {
    this.prepareOrdersTimeData();
    this.prepareCategoryData();
    this.prepareRevenueData();
  }

  private prepareOrdersTimeData(): void {
    const days: DailyData[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const codOrders = this.orders.filter(o =>
        new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd &&
        o.paymentMethod === 'CASH_ON_DELIVERY'
      ).length;

      const onlineOrders = this.orders.filter(o =>
        new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd &&
        o.paymentMethod === 'ONLINE_PAYMENT'
      ).length;

      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' :
        date.toLocaleDateString('en-US', { weekday: 'short' });

      days.push({ label: dayLabel, value: codOrders, value2: onlineOrders });
    }
    this.ordersTimeData = days;
  }

  private prepareCategoryData(): void {
    const categoryMap = new Map<string, number>();
    this.stores.forEach(s => {
      categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + 1);
    });

    this.categoryData = Array.from(categoryMap.entries())
      .map(([label, value]) => ({ label, value }));
  }

  private prepareRevenueData(): void {
    const months: { [key: string]: number } = {};
    this.orders
      .filter(o => o.status === 'COMPLETED')
      .forEach(o => {
        const month = new Date(o.createdAt).toLocaleString('en-US', { month: 'short' });
        months[month] = (months[month] || 0) + o.price;
      });

    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.revenueData = allMonths.map(m => ({
      label: m,
      value: months[m] || 0
    }));
  }

  // ── Chart Initialization ───────────────────────────────────
  private initOrdersChart(): void {
    const canvas = document.getElementById('ordersTimeChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.ordersChart) this.ordersChart.destroy();

    this.ordersChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.ordersTimeData.map(d => d.label),
        datasets: [
          {
            label: 'Online Payment',
            data: this.ordersTimeData.map(d => d.value2 || 0),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Cash on Delivery',
            data: this.ordersTimeData.map(d => d.value),
            borderColor: '#FF6B35',
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#FF6B35',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 600 } } },
          tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, cornerRadius: 8 }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#F1F5F9' }, border: { display: false }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  private initCategoryChart(): void {
    const canvas = document.getElementById('categoryDonutChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.categoryChart) this.categoryChart.destroy();

    const colors: { [key: string]: string } = {
      RESTAURANT: '#FF6B35', PHARMACY: '#22C55E', SUPERMARKET: '#3B82F6', SPECIAL_DELIVERY: '#8B5CF6'
    };

    this.categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.categoryData.length > 0 ? this.categoryData.map(d => d.label) : ['No Data'],
        datasets: [{
          data: this.categoryData.length > 0 ? this.categoryData.map(d => d.value) : [1],
          backgroundColor: this.categoryData.length > 0 ? this.categoryData.map(d => colors[d.label] || '#94a3b8') : ['#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 12, weight: 600 } } },
          tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, cornerRadius: 8 }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  private initRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.revenueChart) this.revenueChart.destroy();

    this.revenueChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.revenueData.map(d => d.label),
        datasets: [{
          label: 'Revenue (DH)',
          data: this.revenueData.map(d => d.value),
          backgroundColor: '#FF6B35',
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, cornerRadius: 8, callbacks: { label: ctx => `${ctx.raw} DH` } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#F1F5F9' }, border: { display: false }, ticks: { font: { size: 11 }, callback: v => `${v} DH` } },
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'POSITIVE': return '#22C55E';
      case 'NEGATIVE': return '#EF4444';
      case 'NEUTRAL':  return '#3B82F6';
      default: return '#6b7a90';
    }
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = {
      PENDING: 'badge-gray', ACCEPTED: 'badge-blue', ASSIGNED: 'badge-orange',
      DELIVERED: 'badge-green', CANCELLED: 'badge-red', PICKED_UP: 'badge-purple'
    };
    return m[status] ?? 'badge-gray';
  }

  getPaymentClass(method: string): string {
    return method === 'CASH_ON_DELIVERY' ? 'badge-orange' : 'badge-blue';
  }

  getPaymentLabel(method: string): string {
    return method === 'CASH_ON_DELIVERY' ? 'COD' : 'Online';
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getStars(rating: number): string {
    const f = Math.round(rating);
    return '★'.repeat(f) + '☆'.repeat(5 - f);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}