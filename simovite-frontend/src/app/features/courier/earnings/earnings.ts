import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { DeliveryService } from '@services/delivery.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { Delivery, DeliveryStatus } from '@models/delivery.model';

Chart.register(...registerables);

@Component({
  selector: 'app-earnings',
  standalone: false,
  templateUrl: './earnings.html',
  styleUrls: ['./earnings.scss']
})
export class Earnings implements OnInit, AfterViewInit {
  deliveries: Delivery[] = [];
  filteredDeliveries: Delivery[] = [];
  loading = true;
  error = '';

  // Period filter
  selectedPeriod: '7d' | '30d' | 'all' = '7d';

  // Chart data
  earningsChartData: { label: string; value: number }[] = [];
  private chartInstance: Chart | null = null;

  constructor(
    private deliverySvc: DeliveryService,
    private keycloak: KeycloakService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEarnings();
  }

  ngAfterViewInit(): void {
    // Chart will be initialized after data loads
  }

  // ── Load Data ──────────────────────────────────────────
  loadEarnings(): void {
    this.loading = true;
    this.error = '';

    // Use getMine() to fetch only THIS courier's deliveries
    this.deliverySvc.getMine().subscribe({
      next: (deliveries) => {
        // Filter to completed deliveries only
        this.deliveries = deliveries.filter(d => d.status === 'DELIVERED');
        this.applyPeriodFilter();
        this.prepareChartData();
        this.loading = false;
        this.cdr.detectChanges();

        // Init chart after view is ready
        setTimeout(() => this.initChart(), 200);
      },
      error: (err) => {
        console.error('Failed to load earnings:', err);
        this.error = 'Failed to load your earnings data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Computed Stats ─────────────────────────────────────
  get totalEarnings(): number {
    return this.filteredDeliveries.reduce((sum, d) => sum + (d.deliveryCost || 0), 0);
  }

  get totalDeliveries(): number {
    return this.filteredDeliveries.length;
  }

  get avgPerDelivery(): number {
    return this.totalDeliveries > 0 ? this.totalEarnings / this.totalDeliveries : 0;
  }

  get longestStreak(): number {
    // Simplified: count consecutive days
    if (this.filteredDeliveries.length === 0) return 0;
    return this.filteredDeliveries.length; // Placeholder
  }

  get cashOnDelivery(): number {
    return this.filteredDeliveries
      .filter(d => d.cashOnDelivery)
      .reduce((sum, d) => sum + (d.amountToCollect || 0), 0);
  }

  // ── Period Filter ──────────────────────────────────────
  setPeriod(period: '7d' | '30d' | 'all'): void {
    this.selectedPeriod = period;
    this.applyPeriodFilter();
    this.prepareChartData();
    setTimeout(() => this.initChart(), 100);
  }

  applyPeriodFilter(): void {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    this.filteredDeliveries = this.deliveries.filter(d => {
      const date = new Date(d.createdAt || d.deliveredAt || '');
      if (this.selectedPeriod === 'all') return true;
      if (this.selectedPeriod === '7d') {
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }
      if (this.selectedPeriod === '30d') {
        const monthAgo = new Date(todayStart);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      }
      return true;
    });
  }

  // ── Chart Data ─────────────────────────────────────────
  prepareChartData(): void {
    const data: { label: string; value: number }[] = [];
    const now = new Date();
    const dayCount = this.selectedPeriod === '7d' ? 7 : this.selectedPeriod === '30d' ? 30 : 12;

    if (this.selectedPeriod === 'all') {
      // Group by month
      const monthMap = new Map<string, number>();
      this.filteredDeliveries.forEach(d => {
        const date = new Date(d.createdAt || d.deliveredAt || '');
        const key = date.toLocaleString('en-US', { month: 'short' });
        monthMap.set(key, (monthMap.get(key) || 0) + (d.deliveryCost || 0));
      });
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        .forEach(m => data.push({ label: m, value: monthMap.get(m) || 0 }));
    } else {
      // Group by day
      for (let i = dayCount - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayEarnings = this.filteredDeliveries
          .filter(d => {
            const dDate = new Date(d.createdAt || d.deliveredAt || '');
            return dDate >= dayStart && dDate < dayEnd;
          })
          .reduce((sum, d) => sum + (d.deliveryCost || 0), 0);

        const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' :
          date.toLocaleDateString('en-US', { weekday: this.selectedPeriod === '7d' ? 'short' : undefined, month: 'short', day: 'numeric' });
        data.push({ label, value: Math.round(dayEarnings * 100) / 100 });
      }
    }

    this.earningsChartData = data;
  }

  // ── Chart Init ─────────────────────────────────────────
  private initChart(): void {
    const canvas = document.getElementById('earningsChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartInstance) this.chartInstance.destroy();

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.earningsChartData.map(d => d.label),
        datasets: [{
          label: 'Earnings (DH)',
          data: this.earningsChartData.map(d => d.value),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: { label: ctx => `${ctx.raw} DH` }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.04)' },
            ticks: { color: '#64748b', font: { size: 11 }, callback: v => `${v} DH` }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10 }, maxRotation: this.selectedPeriod === '30d' ? 45 : 0 }
          }
        }
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getStoreName(delivery: Delivery): string {
    // Could be fetched from store service, placeholder for now
    return 'Store #' + (delivery.orderRef?.slice(0, 4) || 'N/A');
  }
}
