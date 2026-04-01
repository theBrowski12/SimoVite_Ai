import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';

// Import de ton DeliveryService pour avoir les vraies stats de véhicules
import { DeliveryService } from '@services/delivery.service';
import { Delivery } from '@models/delivery.model';
import { ReviewService } from '@services/review.service';
import { ReviewResponseDto } from '@models/review.model';
Chart.register(...registerables);

@Component({ 
  selector: 'app-ml-insights', 
  standalone: false, 
  templateUrl: './ml-insights.html', 
  styleUrls: ['./ml-insights.scss'] 
})
export class MlInsights implements OnInit, OnDestroy {

  // ==========================================
  // 1. VARIABLES KPI & ML (À connecter à une future API /api/metrics/ml)
  // ==========================================
  etaMetrics  = { mae: 1.8, r2: 0.97, accuracy: 91, samples: 180 };
  priceMetrics= { mae: 2.3, r2: 0.95, accuracy: 88, samples: 200 };
  
  sentimentMetrics = {
    totalAnalyzed: 0,
    incoherentCount: 0,
    get incoherentPercentage() {
      if (this.totalAnalyzed === 0) return '0.0';
      return ((this.incoherentCount / this.totalAnalyzed) * 100).toFixed(1);
    }
  };
  nlpConfidence = 0;

  apiHealth = { latency: 42 };
  flaggedReviews: ReviewResponseDto[] = [];
  // Facteurs dynamiques liés au template HTML
  weatherData = { condition: 'Pluie légère', impact: 1.15 };
  
  rushData = [
    { period: 'Morning rush (7–9h)',   factor: 1.35 },
    { period: 'Lunch (12–14h)',        factor: 1.15 },
    { period: 'Normal',                factor: 1.00 },
    { period: 'Evening rush (17–20h)', factor: 1.40 },
    { period: 'Night (22h–5h)',        factor: 0.85 },
  ];

  featureImportance = [
    { name: 'Distance', value: 85, color: 'var(--blue)' },
    { name: 'Trafic', value: 65, color: 'var(--orange)' },
    { name: 'Météo', value: 40, color: 'var(--purple)' },
    { name: 'Véhicule', value: 30, color: 'var(--green)' }
  ];

  // ==========================================
  // 2. DONNÉES RÉELLES (VÉHICULES & AVIS)
  // ==========================================
  vehicleData: { type: string, icon: string, orders: number }[] = [];
  


  charts: { [key: string]: Chart } = {};

  constructor(
    private deliveryService: DeliveryService,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialisation des graphiques statiques/mockés
    this.buildEtaChart();
    this.loadRealReviewsData();
    // Chargement des vraies données
    this.loadRealVehicleData();
  }

  ngOnDestroy(): void {
    // Nettoyage des instances Chart.js pour éviter les fuites de mémoire
    Object.values(this.charts).forEach(chart => chart.destroy());
  }

  // ==========================================
  // INTÉGRATION DES VRAIES DONNÉES
  // ==========================================
  private loadRealVehicleData() {
    this.deliveryService.getAll().subscribe({
      next: (deliveries: Delivery[]) => {
        // Compter les livraisons par type de véhicule
        const counts = deliveries.reduce((acc, delivery) => {
          const vType = delivery.vehicleType || 'UNKNOWN';
          acc[vType] = (acc[vType] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // Dictionnaire pour associer les bons emojis
        const iconMap: { [key: string]: string } = {
          'MOTORCYCLE': '🛵',
          'CAR': '🚗',
          'BICYCLE': '🚲',
          'TRUCK': '🚛',
          'UNKNOWN': '❓'
        };

        // Construire le tableau final
        this.vehicleData = Object.keys(counts).map(key => ({
          type: key,
          icon: iconMap[key] || '📦',
          orders: counts[key]
        }));

        // Construire le graphique AVEC les vraies données
        this.buildVehicleChart();
        this.cdr.detectChanges(); // Forcer la mise à jour de l'UI
      },
      error: (err) => {
        console.error('Impossible de charger les livraisons', err);
      }
    });
  }
private loadRealReviewsData() {
    this.reviewService.getReviews().subscribe({
      next: (reviews) => {
        // Met à jour le nombre total d'avis analysés
        this.sentimentMetrics.totalAnalyzed = reviews.length;
        
        // Filtre uniquement les avis marqués comme incohérents par l'IA
        const incoherents = reviews.filter(r => r.incoherent);
        this.sentimentMetrics.incoherentCount = incoherents.length;
        this.flaggedReviews = incoherents;

        // Calcul dynamique de la confiance NLP moyenne
        if (reviews.length > 0) {
           const totalScore = reviews.reduce((sum, r) => sum + (r.sentimentScore || 0), 0);
           this.nlpConfidence = Math.round((totalScore / reviews.length) * 100);
        }

        this.cdr.detectChanges(); // Met à jour l'UI
      },
      error: (err) => {
        console.error('Erreur lors du chargement des avis pour ML Insights:', err);
      }
    });
  }
  // ==========================================
  // GRAPHIQUES (Chart.js)
  // ==========================================
  private buildEtaChart(): void {
    setTimeout(() => {
      this.createOrUpdateChart('etaChart', { 
        type: 'line', 
        data: { 
          labels: Array.from({length:30}, (_,i) => 'D'+(i+1)), 
          datasets: [
            { label: 'Predicted ETA', data: Array.from({length:30}, () => Math.floor(18+Math.random()*12)), borderColor: '#FF6B35', tension: .4, pointRadius: 2 },
            { label: 'Actual Time',   data: Array.from({length:30}, () => Math.floor(16+Math.random()*16)), borderColor: '#3B82F6', tension: .4, pointRadius: 2, borderDash: [4,3] }
          ]
        }, 
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { legend: { position: 'bottom' } }, 
          scales: { y: { grid: { color: 'rgba(0,0,0,.04)' } }, x: { display: false } } 
        } 
      });
    }, 100);
  }

  private buildVehicleChart(): void {
    setTimeout(() => {
      if (this.vehicleData.length === 0) return;

      this.createOrUpdateChart('vehicleChart', { 
        type: 'doughnut', 
        data: { 
          labels: this.vehicleData.map(v => `${v.icon} ${v.type}`), 
          datasets: [{ 
            data: this.vehicleData.map(v => v.orders), 
            backgroundColor: ['#FF6B35','#3B82F6','#8B5CF6','#F59E0B', '#9CA3AF'], 
            borderWidth: 0 
          }]
        }, 
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          cutout: '65%', 
          plugins: { legend: { position: 'bottom' } } 
        } 
      });
    }, 100);
  }

  private createOrUpdateChart(canvasId: string, config: any) {
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    this.charts[canvasId] = new Chart(ctx, config);
  }

  // ==========================================
  // UTILITAIRES UI (Appelés par le HTML)
  // ==========================================
  getStars(rating: number): string {
    const fullStars = '★'.repeat(Math.round(rating));
    const emptyStars = '☆'.repeat(5 - Math.round(rating));
    return fullStars + emptyStars;
  }

  viewReviewDetails(id: number): void {
    console.log(`Ouverture des détails NLP pour l'avis ID: ${id}`);
    // Ici tu pourras ouvrir un modal ou router vers une page de détail
  }

}