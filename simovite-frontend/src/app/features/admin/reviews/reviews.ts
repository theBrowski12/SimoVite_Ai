import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReviewResponseDto, ReviewTargetType } from '@models/review.model';
import { ReviewService } from '@services/review.service'; 

@Component({
  selector: 'app-admin-reviews',
  standalone: false,
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.scss']
})
export class AdminReviews implements OnInit {

  reviews: ReviewResponseDto[] = [];
  filtered: ReviewResponseDto[] = [];
  loading = true;
  
  // Filtres
  filterSentiment = '';
  filterType      = '';
  filterRating    = '';
  searchTerm      = '';
  
  // Pagination
  currentPage     = 1;
  pageSize        = 10;

  constructor(private reviewService: ReviewService,private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  // --- CHARGEMENT RÉEL ---
  loadReviews(): void {
    this.loading = true;
    // On appelle getReviews() sans paramètres pour tout récupérer côté Admin
    this.reviewService.getReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des avis:', err);
        this.loading = false;
        // Tu pourrais ajouter une notification d'erreur ici
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.filtered = this.reviews.filter(r =>
      (!this.filterSentiment || r.sentiment  === this.filterSentiment) &&
      (!this.filterType      || r.targetType === this.filterType) &&
      (!this.filterRating    || Math.floor(r.rating) === +this.filterRating) &&
      (!this.searchTerm      || 
        r.clientName?.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        r.comment?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (r as any).targetName?.toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );
    this.currentPage = 1;
}

  // --- SUPPRESSION RÉELLE ---
deleteReview(id: string): void {
    if (!confirm('Voulez-vous vraiment supprimer cet avis ?')) return;

    this.reviewService.deleteReview(id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id !== id);
        this.applyFilters();
        
        // 👇 Utile ici aussi pour rafraîchir le tableau instantanément
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        alert('Impossible de supprimer l\'avis.');
      }
    });
  }

  // --- GETTERS & HELPERS ---
  get paginated(): ReviewResponseDto[] { 
    return this.filtered.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); 
  }
  
  get totalPages(): number  { return Math.ceil(this.filtered.length / this.pageSize); }
  get pages(): number[]     { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  get totalCount():     number { return this.reviews.length; }
  get positiveCount(): number { return this.reviews.filter(r => r.sentiment === 'POSITIVE').length; }
  get negativeCount(): number { return this.reviews.filter(r => r.sentiment === 'NEGATIVE').length; }
  get incoherentCount(): number { return this.reviews.filter(r => r.incoherent).length; }
  
  get avgRating(): number {
    if (!this.reviews.length) return 0;
    return +(this.reviews.reduce((a, r) => a + r.rating, 0) / this.reviews.length).toFixed(1);
  }

  getSentimentClass(s?: string): string {
    const m: Record<string,string> = { POSITIVE:'badge-green', NEGATIVE:'badge-red', MIXED:'badge-amber' };
    return s ? (m[s] ?? 'badge-gray') : 'badge-gray';
  }

  getSentimentIcon(s?: string): string {
    const m: Record<string,string> = { POSITIVE:'😊', NEGATIVE:'😞', MIXED:'😐' };
    return s ? (m[s] ?? '❓') : '—';
  }

  getStars(r: number): string { return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); }

  reset(): void { 
    this.filterSentiment = ''; 
    this.filterType = ''; 
    this.filterRating = ''; 
    this.searchTerm = ''; 
    this.applyFilters(); 
  }
}