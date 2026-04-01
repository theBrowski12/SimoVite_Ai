import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';

// IMPORT DE TES VRAIS SERVICES
import { OrderService } from '@services/order.service';
import { DeliveryService } from '@services/delivery.service';
import { Order } from '@models/order.model';
import { Delivery } from '@models/delivery.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-statistics',
  templateUrl: './statistics.html',
  styleUrls: ['./statistics.scss'],
  standalone: false
})
export class AdminStatistics implements OnInit {
  isLoading = true;
  errorMessage = ''; // Optionnel : pour afficher une erreur sur l'UI
  
  kpis = {
    monthOrders: 0,
    monthRevenue: 0,
    avgDeliveryTime: 0, 
    repeatRate: 0
  };

  charts: { [key: string]: Chart } = {};

  // INJECTION DE TES SERVICES ICI
  constructor(
    private orderService: OrderService,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRealData();
  }

  loadRealData() {
    this.isLoading = true;
    this.errorMessage = '';

    // 1. On utilise tes services qui pointent vers l'API Gateway !
    const orders$ = this.orderService.getAll();
    const deliveries$ = this.deliveryService.getAll();

    forkJoin({
      orders: orders$,
      deliveries: deliveries$
    }).subscribe({
      next: (res) => {
        // res.orders est maintenant du type Order[]
        // res.deliveries est du type Delivery[]
        
        this.calculateKPIs(res.orders);
        // Calcul du temps moyen de livraison
        const deliveriesWithTime = res.deliveries.filter(d => d.estimatedTimeInMinutes);
        if (deliveriesWithTime.length > 0) {
          const totalTime = deliveriesWithTime.reduce((sum, d) => sum + (d.estimatedTimeInMinutes || 0), 0);
          this.kpis.avgDeliveryTime = Math.round(totalTime / deliveriesWithTime.length);
        }
        this.buildPaymentChart(res.orders);
        this.buildStatusChart(res.deliveries);
        this.buildRevenueChart(res.orders);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur critique API Gateway :', err);
        this.errorMessage = "Impossible de récupérer les données depuis le serveur.";
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // CALCUL DES KPIs
  // ==========================================
  private calculateKPIs(orders: Order[]) {
    this.kpis.monthOrders = orders.length;
    // Plus d'erreur TypeScript, on utilise la vraie propriété "price"
    this.kpis.monthRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  }

  // ==========================================
  // GÉNÉRATION DES GRAPHIQUES
  // ==========================================

  private buildPaymentChart(orders: Order[]) {
    const paymentCounts = orders.reduce((acc, order) => {
      // Utilisation directe de la propriété fortement typée
      const method = order.paymentMethod || 'UNKNOWN';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    this.createOrUpdateChart('paymentChart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(paymentCounts),
        datasets: [{
          data: Object.values(paymentCounts),
          backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
    });
  }

  private buildStatusChart(deliveries: Delivery[]) {
    const statusCounts = deliveries.reduce((acc, delivery) => {
      // Ton DeliveryService utilise un enum DeliveryStatus
      const status = delivery.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    this.createOrUpdateChart('statusChart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#22c55e', '#3b82f6', '#ef4444', '#eab308'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
    });
  }

  private buildRevenueChart(orders: Order[]) {
    const revenueByMonth = orders.reduce((acc, order) => {
      // On utilise createdAt et price qui existent dans ton interface Order
      if (order.createdAt && order.price) {
        // Découpe la date pour garder "YYYY-MM"
        const month = new Date(order.createdAt).toISOString().slice(0, 7); 
        acc[month] = (acc[month] || 0) + order.price;
      }
      return acc;
    }, {} as { [key: string]: number });

    const sortedMonths = Object.keys(revenueByMonth).sort();
    const data = sortedMonths.map(month => revenueByMonth[month]);

    this.createOrUpdateChart('revenueChart', {
      type: 'bar',
      data: {
        labels: sortedMonths,
        datasets: [{
          label: 'Revenue (DH)',
          data: data,
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private createOrUpdateChart(canvasId: string, config: any) {
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    this.charts[canvasId] = new Chart(canvasId, config);
  }
}