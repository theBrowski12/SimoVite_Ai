import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard implements OnInit, AfterViewInit {
  today: Date = new Date();
  stats = { dailyOrders: 154, dailyRevenue: 12450, activeDrivers: 28, pendingSupport: 3 };
  
  reviews = [
    { clientName: 'Anas M.', comment: 'Livraison super rapide !', rating: 5, sentiment: 'POSITIVE' },
    { clientName: 'Sami T.', comment: 'Le repas était froid à l\'arrivée.', rating: 2, sentiment: 'NEGATIVE' },
    { clientName: 'Yasmine K.', comment: 'Bonne expérience globale.', rating: 4, sentiment: 'NEUTRAL' },
    { clientName: 'Karim L.', comment: 'Articles manquants dans ma commande.', rating: 1, sentiment: 'NEGATIVE' }
  ];
  recentOrders = [
      { ref: 'SV20260320001', client: 'Mohamed B.', store: 'Pizza Maarif', total: '87.50 DH', payment: 'COD', paymentClass: 'badge-orange', status: 'DELIVERED', statusClass: 'badge-green', date: '20 Mar 2026' },
      { ref: 'SV20260320002', client: 'Sara K.', store: 'Pharmacie Centrale', total: '142.00 DH', payment: 'ONLINE', paymentClass: 'badge-blue', status: 'ASSIGNED', statusClass: 'badge-orange', date: '20 Mar 2026' },
      { ref: 'SV20260320003', client: 'Yassine A.', store: 'Marjane Maarif', total: '320.00 DH', payment: 'ONLINE', paymentClass: 'badge-blue', status: 'ACCEPTED', statusClass: 'badge-blue', date: '20 Mar 2026' },
      { ref: 'SV20260320004', client: 'Fatima Z.', store: 'Burger House', total: '65.00 DH', payment: 'COD', paymentClass: 'badge-orange', status: 'PENDING', statusClass: 'badge-gray', date: '20 Mar 2026' },
      { ref: 'SV20260320005', client: 'Khalid M.', store: 'Sushi King', total: '210.00 DH', payment: 'ONLINE', paymentClass: 'badge-blue', status: 'CANCELLED', statusClass: 'badge-red', date: '20 Mar 2026' },
    ];
  constructor() {}

  ngOnInit(): void {
    this.initOrdersChart();
    this.initCategoryChart();
    this.initRevenueChart();
  }

  ngAfterViewInit(): void {
    this.initRevenueChart();
  }

initRevenueChart() {
    new Chart('revenueChart', {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Revenue (DH)',
          data: [12000, 19000, 15000, 22000, 18000, 25000, 21000, 28000, 24000, 30000, 27000, 35000],
          backgroundColor: '#FF6B35',
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#F1F5F9' },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });
  }
  getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'POSITIVE': return '#22C55E'; // Vert
    case 'NEGATIVE': return '#EF4444'; // Rouge
    case 'NEUTRAL': return '#3B82F6';  // Bleu
    default: return '#6b7a90';         // Gris
  }
}
initOrdersChart() {
    new Chart('ordersTimeChart', {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Online Payment',
            data: [28, 35, 40, 52, 61, 78, 85],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Cash on Delivery',
            data: [42, 58, 51, 67, 74, 89, 93],
            borderColor: '#FF6B35',
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

initCategoryChart() {
    new Chart('categoryDonutChart', {
      type: 'doughnut',
      data: {
        labels: ['Restaurant', 'Pharmacy', 'Supermarket', 'Special'],
        datasets: [{
          data: [45, 15, 25, 15],
          backgroundColor: ['#FF6B35', '#22C55E', '#3B82F6', '#8B5CF6'],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '70%',
        plugins: { legend: { position: 'bottom' } },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}