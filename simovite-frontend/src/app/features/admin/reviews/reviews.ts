import { Component, OnInit } from '@angular/core';

interface Review {
  id: string;
  clientName: string;
  targetId: string;
  targetName: string;
  targetType: 'PRODUCT' | 'STORE';
  comment: string;
  rating: number;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'MIXED';
  sentimentScore?: number;
  sentimentAnalyzed?: boolean;
  incoherent?: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.scss']
})
export class AdminReviews implements OnInit {

  reviews: Review[] = [];
  filtered: Review[] = [];
  loading = true;
  filterSentiment = '';
  filterType      = '';
  filterRating    = '';
  searchTerm      = '';
  currentPage     = 1;
  pageSize        = 10;

  private mock: Review[] = [
    { id:'1', clientName:'Anas M.',    targetId:'s1', targetName:'Pizza Maarif',       targetType:'STORE',   comment:'Livraison super rapide, pizza encore chaude !',             rating:5, sentiment:'POSITIVE', sentimentScore:.92, sentimentAnalyzed:true,  incoherent:false, createdAt:'2026-03-20T09:14:00' },
    { id:'2', clientName:'Sami T.',    targetId:'p1', targetName:'Burger Classic',      targetType:'PRODUCT', comment:'Le repas était froid à l\'arrivée, très déçu.',              rating:2, sentiment:'NEGATIVE', sentimentScore:.87, sentimentAnalyzed:true,  incoherent:false, createdAt:'2026-03-20T09:32:00' },
    { id:'3', clientName:'Yasmine K.', targetId:'s2', targetName:'Pharmacie Centrale',  targetType:'STORE',   comment:'Bonne expérience globale.',                                  rating:4, sentiment:'MIXED',    sentimentScore:.55, sentimentAnalyzed:true,  incoherent:false, createdAt:'2026-03-20T09:45:00' },
    { id:'4', clientName:'Karim L.',   targetId:'p2', targetName:'Paracetamol 500mg',   targetType:'PRODUCT', comment:'Articles manquants dans ma commande, pas content.',          rating:1, sentiment:'NEGATIVE', sentimentScore:.94, sentimentAnalyzed:true,  incoherent:false, createdAt:'2026-03-20T10:02:00' },
    { id:'5', clientName:'Sara B.',    targetId:'s3', targetName:'Sushi King',          targetType:'STORE',   comment:'Très bien, livraison parfaite !',                            rating:5, sentiment:'POSITIVE', sentimentScore:.95, sentimentAnalyzed:true,  incoherent:false, createdAt:'2026-03-20T10:18:00' },
    { id:'6', clientName:'Omar F.',    targetId:'s1', targetName:'Pizza Maarif',        targetType:'STORE',   comment:'Nul, jamais plus.',                                          rating:5, sentiment:'NEGATIVE', sentimentScore:.88, sentimentAnalyzed:true,  incoherent:true,  createdAt:'2026-03-20T10:35:00' },
  ];

  ngOnInit(): void {
    // TODO: inject ReviewService
    setTimeout(() => { this.reviews = this.mock; this.filtered = this.mock; this.loading = false; }, 400);
  }

  applyFilters(): void {
    this.filtered = this.reviews.filter(r =>
      (!this.filterSentiment || r.sentiment  === this.filterSentiment) &&
      (!this.filterType      || r.targetType === this.filterType) &&
      (!this.filterRating    || Math.floor(r.rating) === +this.filterRating) &&
      (!this.searchTerm      || r.clientName.toLowerCase().includes(this.searchTerm.toLowerCase()) || r.comment.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
    this.currentPage = 1;
  }

  get paginated(): Review[] { return this.filtered.slice((this.currentPage-1)*this.pageSize, this.currentPage*this.pageSize); }
  get totalPages(): number  { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages(): number[]     { return Array.from({ length: this.totalPages }, (_, i) => i+1); }

  // Stats
  get totalCount():    number { return this.reviews.length; }
  get positiveCount(): number { return this.reviews.filter(r => r.sentiment === 'POSITIVE').length; }
  get negativeCount(): number { return this.reviews.filter(r => r.sentiment === 'NEGATIVE').length; }
  get avgRating():     number {
    if (!this.reviews.length) return 0;
    return +(this.reviews.reduce((a, r) => a + r.rating, 0) / this.reviews.length).toFixed(1);
  }
  get incoherentCount(): number { return this.reviews.filter(r => r.incoherent).length; }

  getSentimentClass(s?: string): string {
    const m: Record<string,string> = { POSITIVE:'badge-green', NEGATIVE:'badge-red', MIXED:'badge-amber' };
    return s ? (m[s] ?? 'badge-gray') : 'badge-gray';
  }
  getSentimentIcon(s?: string): string {
    const m: Record<string,string> = { POSITIVE:'😊', NEGATIVE:'😞', MIXED:'😐' };
    return s ? (m[s] ?? '❓') : '—';
  }
  getStars(r: number): string { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }

  deleteReview(id: string): void {
    if (!confirm('Delete this review?')) return;
    this.reviews  = this.reviews.filter(r => r.id !== id);
    this.applyFilters();
  }
  reset(): void { this.filterSentiment = ''; this.filterType = ''; this.filterRating = ''; this.searchTerm = ''; this.applyFilters(); }
}
