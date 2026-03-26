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

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initRevenueChart();
  }

  initRevenueChart() {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Revenus (DH)',
          data: [12000, 19000, 15000, 22000, 30000, 45000, 38000],
          backgroundColor: '#FF6B35', // Ton orange SimoVite
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
}