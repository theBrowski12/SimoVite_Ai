import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '@services/order.service';
import { StoreService } from '@services/store.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { Order, OrderStatus, PaymentMethod } from '@models/order.model';
import { StoreResponseDto } from '@models/store.model';

Chart.register(...registerables);

export type PeriodFilter = 'today' | '7d' | '30d' | 'all';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  activeProducts: number;
  storeRating: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-store-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, AfterViewInit {
  today: Date = new Date();

  // Data
  stores: StoreResponseDto[] = [];
  selectedStore: StoreResponseDto | null = null;
  allOrders: Order[] = [];
  filteredOrders: Order[] = [];
  recentOrders: Order[] = [];
  loading = true;
  error = '';

  // Period filter
  selectedPeriod: PeriodFilter = '7d';

  // KPI Stats
  stats: DashboardStats = {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    activeProducts: 0,
    storeRating: 0
  };

  // Products data
  products: { name: string; sold: number; revenue: number }[] = [];

  // Chart data
  revenueChartData: ChartDataPoint[] = [];
  ordersChartData: ChartDataPoint[] = [];
  paymentChartData: { label: string; value: number }[] = [];
  statusChartData: { label: string; value: number }[] = [];

  // Chart instances
  private revenueChartInstance: Chart | null = null;
  private ordersChartInstance: Chart | null = null;
  private paymentChartInstance: Chart | null = null;
  private statusChartInstance: Chart | null = null;

  // Display
  ownerName = '';

  constructor(
    private orderSvc: OrderService,
    private storeSvc: StoreService,
    private keycloak: KeycloakService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ownerName = this.keycloak.getFullName();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts initialized after data loads
  }

  // ── Data Loading ──────────────────────────────────────────

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    const userId = this.keycloak.getUserId();
    if (!userId) {
      this.error = 'Unable to identify user.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.storeSvc.getStoresByOwner(userId).subscribe({
      next: (stores) => {
        this.stores = stores;
        if (stores.length === 0) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        if (!this.selectedStore) {
          this.selectedStore = stores[0];
        }

        const storeIds = stores.map(s => s.id);
        this.fetchOrdersForStores(storeIds);
      },
      error: (err) => {
        console.error('Failed to fetch stores:', err);
        this.error = 'Failed to load store data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectStore(store: StoreResponseDto): void {
    this.selectedStore = store;
    this.applyPeriodFilter();
    this.cdr.detectChanges();
  }

  private fetchOrdersForStores(storeIds: string[]): void {
    const requests = storeIds.map(id => this.orderSvc.getByStoreId(id));

    Promise.all(requests.map(r => r.toPromise()))
      .then((results: (Order[] | undefined)[]) => {
        this.allOrders = results.filter((r): r is Order[] => r !== undefined).flat();
        this.applyPeriodFilter();
      })
      .catch((err) => {
        console.error('Failed to fetch orders:', err);
        this.error = 'Failed to load order data.';
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  // ── Period Filter ────────────────────────────────────────

  setPeriod(period: PeriodFilter): void {
    this.selectedPeriod = period;
    this.applyPeriodFilter();
  }

  private applyPeriodFilter(): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // First filter by selected store, then by period
    const storeOrders = this.allOrders.filter(o =>
      this.selectedStore ? o.storeId === this.selectedStore.id : true
    );

    this.filteredOrders = storeOrders.filter(o => {
      const orderDate = new Date(o.createdAt);

      switch (this.selectedPeriod) {
        case 'today':
          return orderDate >= todayStart;
        case '7d': {
          const weekAgo = new Date(todayStart);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDate >= weekAgo;
        }
        case '30d': {
          const monthAgo = new Date(todayStart);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDate >= monthAgo;
        }
        case 'all':
          return true;
        default:
          return true;
      }
    });

    this.computeDashboardMetrics();
    this.prepareChartData();

    if (!this.loading) {
      this.initCharts();
      this.cdr.detectChanges();
    } else {
      this.loading = false;
      this.initCharts();
      this.cdr.detectChanges();
    }
  }

  getPeriodLabel(period: PeriodFilter): string {
    const labels: Record<PeriodFilter, string> = {
      today: 'Today',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      all: 'All Time'
    };
    return labels[period];
  }

  // ── Compute Metrics ───────────────────────────────────────

  private computeDashboardMetrics(): void {
    const orders = this.filteredOrders;
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'COMPLETED').length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
    const totalRevenue = orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.price, 0);

    // Active products
    const productMap = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        productMap.set(item.productId, (productMap.get(item.productId) || 0) + item.quantity);
      });
    });
    const activeProducts = Array.from(productMap.values()).filter(q => q > 0).length;

    this.stats = {
      totalOrders: total,
      totalRevenue: totalRevenue,
      avgOrderValue: total > 0 ? Math.round((totalRevenue / total) * 100) / 100 : 0,
      completedOrders: completed,
      pendingOrders: pending,
      cancelledOrders: cancelled,
      activeProducts,
      storeRating: this.selectedStore?.rating || 0
    };

    // Recent orders (last 5)
    this.recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Top products
    this.products = Array.from(productMap.entries())
      .map(([id, sold]) => {
        const orderItems = orders.flatMap(o => o.items);
        const item = orderItems.find(i => i.productId === id);
        return {
          name: item?.productName || 'Unknown',
          sold,
          revenue: item ? item.subTotal * sold / item.quantity : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }

  // ── Chart Data ────────────────────────────────────────────

  private prepareChartData(): void {
    this.prepareRevenueChartData();
    this.prepareOrdersChartData();
    this.preparePaymentChartData();
    this.prepareStatusChartData();
  }

  private prepareRevenueChartData(): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days: ChartDataPoint[] = [];

    // Use filteredOrders (already filtered by store + period)
    const orders = this.filteredOrders.filter(o => o.status === 'COMPLETED');

    let dayCount = 7;
    if (this.selectedPeriod === 'today') dayCount = 1;
    else if (this.selectedPeriod === '7d') dayCount = 7;
    else if (this.selectedPeriod === '30d') dayCount = 14;
    else dayCount = 30;

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate < dayEnd;
        })
        .reduce((sum, o) => sum + o.price, 0);

      let dayLabel: string;
      if (i === 0) dayLabel = 'Today';
      else if (i === 1) dayLabel = 'Yesterday';
      else if (dayCount > 14) dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      else dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

      days.push({ label: dayLabel, value: dayRevenue });
    }

    this.revenueChartData = days;
  }

  private prepareOrdersChartData(): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days: ChartDataPoint[] = [];

    // Use filteredOrders (already filtered by store + period)
    const orders = this.filteredOrders;

    let dayCount = 7;
    if (this.selectedPeriod === 'today') dayCount = 1;
    else if (this.selectedPeriod === '7d') dayCount = 7;
    else if (this.selectedPeriod === '30d') dayCount = 14;
    else dayCount = 30;

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= dayStart && orderDate < dayEnd;
        }).length;

      let dayLabel: string;
      if (i === 0) dayLabel = 'Today';
      else if (i === 1) dayLabel = 'Yesterday';
      else if (dayCount > 14) dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      else dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

      days.push({ label: dayLabel, value: dayOrders });
    }

    this.ordersChartData = days;
  }

  private preparePaymentChartData(): void {
    const orders = this.filteredOrders.filter(o => o.status === 'COMPLETED');
    const codRevenue = orders.filter(o => o.paymentMethod === 'CASH_ON_DELIVERY').reduce((sum, o) => sum + o.price, 0);
    const onlineRevenue = orders.filter(o => o.paymentMethod === 'ONLINE_PAYMENT').reduce((sum, o) => sum + o.price, 0);
    const total = codRevenue + onlineRevenue;

    this.paymentChartData = [
      { label: 'Cash on Delivery', value: total > 0 ? Math.round((codRevenue / total) * 100) : 0 },
      { label: 'Online Payment', value: total > 0 ? Math.round((onlineRevenue / total) * 100) : 0 }
    ];
  }

  private prepareStatusChartData(): void {
    const orders = this.filteredOrders;
    const total = orders.length || 1;

    this.statusChartData = [
      { label: 'Completed', value: Math.round((orders.filter(o => o.status === 'COMPLETED').length / total) * 100) },
      { label: 'Pending', value: Math.round((orders.filter(o => o.status === 'PENDING').length / total) * 100) },
      { label: 'Accepted', value: Math.round((orders.filter(o => o.status === 'ACCEPTED').length / total) * 100) },
      { label: 'Cancelled', value: Math.round((orders.filter(o => o.status === 'CANCELLED').length / total) * 100) }
    ];
  }

  // ── Charts ────────────────────────────────────────────────

  private initCharts(): void {
    setTimeout(() => {
      this.initRevenueChart();
      this.initOrdersChart();
      this.initPaymentChart();
      this.initStatusChart();
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
        labels: this.revenueChartData.length > 0 ? this.revenueChartData.map(d => d.label) : ['No Data'],
        datasets: [{
          label: 'Revenue (DH)',
          data: this.revenueChartData.length > 0 ? this.revenueChartData.map(d => d.value) : [0],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#22c55e',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            displayColors: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { color: '#6b7280', font: { size: 11 }, callback: (value) => value + ' DH' }
          },
          x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } }
        }
      }
    });
  }

  private initOrdersChart(): void {
    const canvas = document.getElementById('ordersChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.ordersChartInstance) this.ordersChartInstance.destroy();

    const colors = this.ordersChartData.map((_, i) => this.getChartColor(i));

    this.ordersChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.ordersChartData.length > 0 ? this.ordersChartData.map(d => d.label) : ['No Data'],
        datasets: [{
          label: 'Orders',
          data: this.ordersChartData.length > 0 ? this.ordersChartData.map(d => d.value) : [0],
          backgroundColor: this.ordersChartData.length > 0 ? colors : ['#e5e7eb'],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 8 } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6b7280', font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 45 } }
        }
      }
    });
  }

  private initPaymentChart(): void {
    const canvas = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.paymentChartInstance) this.paymentChartInstance.destroy();

    const data = this.paymentChartData.length > 0 ? this.paymentChartData.map(d => d.value) : [100];
    const colors = this.paymentChartData.length > 0 ? ['#FF6B35', '#3b82f6'] : ['#e5e7eb'];

    this.paymentChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.paymentChartData.length > 0 ? this.paymentChartData.map(d => d.label) : ['No Data'],
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', color: '#374151', font: { size: 12, weight: 600 } } },
          tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 8, callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } }
        }
      }
    });
  }

  private initStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.statusChartInstance) this.statusChartInstance.destroy();

    this.statusChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.statusChartData.map(d => d.label),
        datasets: [{
          data: this.statusChartData.map(d => d.value),
          backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', color: '#374151', font: { size: 11, weight: 600 } } },
          tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 8, callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}%` } }
        }
      }
    });
  }

  private getChartColor(index: number): string {
    const colors = ['#FF6B35', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
    return colors[index % colors.length];
  }

  // ── Helpers ───────────────────────────────────────────────

  getStatusClass(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      PENDING: 'badge-yellow',
      ACCEPTED: 'badge-blue',
      REJECTED: 'badge-red',
      COMPLETED: 'badge-green',
      CANCELLED: 'badge-gray'
    };
    return map[status] || 'badge-gray';
  }

  getPaymentBadgeClass(method: PaymentMethod): string {
    return method === 'CASH_ON_DELIVERY' ? 'badge-orange' : 'badge-blue';
  }

  getPaymentLabel(method: PaymentMethod): string {
    return method === 'CASH_ON_DELIVERY' ? 'COD' : 'ONLINE';
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getItemsCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTrendIcon(current: number, previous: number): string {
    if (current > previous) return '↑';
    if (current < previous) return '↓';
    return '→';
  }

  getTrendClass(current: number, previous: number): string {
    if (current > previous) return 'trend-up';
    if (current < previous) return 'trend-down';
    return 'trend-neutral';
  }

  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
