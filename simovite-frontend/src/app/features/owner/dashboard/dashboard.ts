import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '@services/order.service';
import { StoreService } from '@services/store.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { Order, OrderStatus, PaymentMethod } from '@models/order.model';
import { StoreResponseDto } from '@models/store.model';

Chart.register(...registerables);

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  activeProducts: number;
  storeRating: number;
  orderFulfillmentRate: number;
  onTimeDelivery: number;
  customerSatisfaction: number;
  productQualityScore: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
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
  orders: Order[] = [];
  recentOrders: Order[] = [];
  loading = true;
  error = '';

  // KPI Stats
  stats: DashboardStats = {
    ordersToday: 0,
    revenueToday: 0,
    activeProducts: 0,
    storeRating: 0,
    orderFulfillmentRate: 0,
    onTimeDelivery: 0,
    customerSatisfaction: 0,
    productQualityScore: 0
  };

  // Products data for table and chart
  products: { name: string; category: string; price: number; stock: number; soldToday: number; status: string; statusClass: string }[] = [];

  // Chart data
  salesChartData: ChartDataPoint[] = [];
  productsChartData: ChartDataPoint[] = [];
  paymentChartData: { label: string; value: number }[] = [];

  // Chart instances
  private salesChartInstance: Chart | null = null;
  private productsChartInstance: Chart | null = null;
  private paymentChartInstance: Chart | null = null;

  // Display
  ownerName = '';

  constructor(
    private orderSvc: OrderService,
    private storeSvc: StoreService,
    private keycloak: KeycloakService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.ownerName = this.keycloak.getFullName();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  // ── Data Loading ──────────────────────────────────────────

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    const userId = this.keycloak.getUserId();
    if (!userId) {
      this.error = 'Unable to identify user.';
      this.loading = false;
      return;
    }

    // Step 1: Fetch owner's stores
    this.storeSvc.getStoresByOwner(userId).subscribe({
      next: (stores) => {
        this.stores = stores;
        if (stores.length === 0) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Step 2: Fetch orders for all stores
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

  private fetchOrdersForStores(storeIds: string[]): void {
    const requests = storeIds.map(id => this.orderSvc.getByStoreId(id));

    Promise.all(requests.map(r => r.toPromise()))
      .then((results: (Order[] | undefined)[]) => {
        this.orders = results.filter((r): r is Order[] => r !== undefined).flat();
        this.computeDashboardMetrics();
        this.initCharts();
        this.loading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        console.error('Failed to fetch orders:', err);
        this.error = 'Failed to load order data.';
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  // ── Compute Metrics ───────────────────────────────────────

  private computeDashboardMetrics(): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter today's orders
    const todayOrders = this.orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= todayStart;
    });

    // KPI: Orders Today
    this.stats.ordersToday = todayOrders.length;

    // KPI: Revenue Today (completed orders)
    this.stats.revenueToday = todayOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.price, 0);

    // KPI: Active Products (unique products with quantity > 0)
    const productSales = this.computeProductSales();
    this.stats.activeProducts = productSales.filter(p => p.soldToday > 0).length;
    this.products = productSales;

    // KPI: Store Rating
    if (this.stores.length > 0 && this.stores[0].rating !== undefined) {
      this.stats.storeRating = this.stores[0].rating;
    }

    // Performance Metrics
    const completedOrders = this.orders.filter(o => o.status === 'COMPLETED').length;
    const totalOrders = this.orders.length;

    this.stats.orderFulfillmentRate = totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

    // Placeholder metrics (can be enhanced with real data if available)
    this.stats.onTimeDelivery = this.stats.orderFulfillmentRate > 0
      ? Math.max(0, this.stats.orderFulfillmentRate - 4)
      : 0;
    this.stats.customerSatisfaction = this.stats.storeRating > 0
      ? Math.round(this.stats.storeRating * 20)
      : 0;
    this.stats.productQualityScore = this.stats.activeProducts > 0 ? 98 : 0;

    // Recent Orders (last 5)
    this.recentOrders = [...this.orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Prepare chart data
    this.prepareSalesChartData();
    this.prepareProductsChartData();
    this.preparePaymentChartData();
  }

  private computeProductSales(): { name: string; category: string; price: number; stock: number; soldToday: number; status: string; statusClass: string }[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const productMap = new Map<string, { name: string; category: string; price: number; stock: number; soldToday: number }>();

    // Aggregate product sales from all orders
    this.orders.forEach(order => {
      order.items.forEach(item => {
        if (!productMap.has(item.productId)) {
          productMap.set(item.productId, {
            name: item.productName,
            category: this.stores[0]?.category || '',
            price: item.unitPrice,
            stock: 0, // Stock would come from a product service
            soldToday: 0
          });
        }

        const product = productMap.get(item.productId)!;
        const isToday = new Date(order.createdAt) >= todayStart;
        if (isToday) {
          product.soldToday += item.quantity;
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.soldToday - a.soldToday)
      .slice(0, 10) // Top 10 products
      .map(p => ({
        ...p,
        status: p.soldToday === 0 && p.stock === 0 ? 'OUT OF STOCK' :
                p.stock < 10 ? 'LOW STOCK' : 'ACTIVE',
        statusClass: p.soldToday === 0 && p.stock === 0 ? 'badge-red' :
                     p.stock < 10 ? 'badge-yellow' : 'badge-green'
      }));
  }

  private prepareSalesChartData(): void {
    const now = new Date();
    const days: { label: string; value: number }[] = [];

    // Last 7 days
    for (let i = 6; i >= 0; i--) {
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
        date.toLocaleDateString('en-US', { weekday: 'short' });

      days.push({ label: dayLabel, value: dayRevenue });
    }

    this.salesChartData = days;
  }

  private prepareProductsChartData(): void {
    this.productsChartData = this.products.slice(0, 5).map(p => ({
      label: p.name,
      value: p.soldToday,
      color: this.getChartColor(this.productsChartData.length)
    }));
  }

  private preparePaymentChartData(): void {
    const codOrders = this.orders.filter(o => o.paymentMethod === 'CASH_ON_DELIVERY' && o.status === 'COMPLETED');
    const onlineOrders = this.orders.filter(o => o.paymentMethod === 'ONLINE_PAYMENT' && o.status === 'COMPLETED');

    const codRevenue = codOrders.reduce((sum, o) => sum + o.price, 0);
    const onlineRevenue = onlineOrders.reduce((sum, o) => sum + o.price, 0);
    const total = codRevenue + onlineRevenue;

    this.paymentChartData = [
      {
        label: 'Cash on Delivery',
        value: total > 0 ? Math.round((codRevenue / total) * 100) : 0
      },
      {
        label: 'Online Payment',
        value: total > 0 ? Math.round((onlineRevenue / total) * 100) : 0
      }
    ];
  }

  // ── Charts ────────────────────────────────────────────────

  private initCharts(): void {
    setTimeout(() => {
      this.initSalesChart();
      this.initProductsChart();
      this.initPaymentChart();
      this.cdr.detectChanges();
    }, 200);
  }

  // Sales Trend (Line Chart)
  private initSalesChart(): void {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }

    this.salesChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.salesChartData.length > 0 ? this.salesChartData.map(d => d.label) : ['No Data'],
        datasets: [{
          label: 'Daily Sales (DH)',
          data: this.salesChartData.length > 0 ? this.salesChartData.map(d => d.value) : [0],
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointBackgroundColor: '#FF6B35',
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#FF6B35',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3
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
            ticks: {
              color: '#6b7280',
              font: { size: 12 },
              callback: (value) => value + ' DH'
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#6b7280',
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  // Top Products (Bar Chart)
  private initProductsChart(): void {
    const canvas = document.getElementById('productsChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.productsChartInstance) {
      this.productsChartInstance.destroy();
    }

    const labels = this.productsChartData.length > 0 ? this.productsChartData.map(d => d.label) : ['No Data'];
    const data = this.productsChartData.length > 0 ? this.productsChartData.map(d => d.value) : [0];
    const colors = this.productsChartData.length > 0
      ? this.productsChartData.map((_, i) => this.getChartColor(i))
      : ['#e5e7eb'];

    this.productsChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Units Sold',
          data,
          backgroundColor: colors,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 40
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
            ticks: {
              color: '#6b7280',
              font: { size: 12 }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#6b7280',
              font: { size: 11 },
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }

  // Payment Method (Doughnut Chart)
  private initPaymentChart(): void {
    const canvas = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.paymentChartInstance) {
      this.paymentChartInstance.destroy();
    }

    const labels = this.paymentChartData.length > 0 ? this.paymentChartData.map(d => d.label) : ['No Data'];
    const data = this.paymentChartData.length > 0 ? this.paymentChartData.map(d => d.value) : [100];
    const colors = this.paymentChartData.length > 0 ? ['#FF6B35', '#3b82f6'] : ['#e5e7eb'];

    this.paymentChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 4,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#374151',
              font: { size: 13, weight: 600 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.label}: ${context.raw}%`
            }
          }
        }
      }
    });
  }

  private getChartColor(index: number): string {
    const colors = ['#FF6B35', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    return colors[index % colors.length];
  }

  // ── Helpers ───────────────────────────────────────────────

  getStatusClass(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      'PENDING': 'badge-yellow',
      'ACCEPTED': 'badge-blue',
      'REJECTED': 'badge-red',
      'COMPLETED': 'badge-green',
      'CANCELLED': 'badge-gray'
    };
    return statusMap[status] || 'badge-gray';
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
}