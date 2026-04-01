import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ReviewResponseDto, ReviewRequestDto } from '@models/review.model';
import { ReviewService } from '@services/review.service';

@Component({
  selector: 'app-my-reviews',
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.scss'],
  standalone: false
})
export class Reviews implements OnInit {
  reviews: ReviewResponseDto[] = [];
  isLoading = true;

  // --- Edit Mode State ---
  editingReviewId: string | null = null;
  editRating: number = 0;
  editComment: string = '';
  isUpdating = false;

  constructor(
    private reviewSvc: ReviewService,
    private cdr: ChangeDetectorRef // <-- Injecte-le ici
  ) {}
  ngOnInit(): void {
    this.loadMyReviews();
  }

  loadMyReviews(): void {
    this.isLoading = true;
    
    // On appelle simplement la méthode, le token JWT (envoyé automatiquement) fait le reste !
    this.reviewSvc.getMyReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        this.isLoading = false;
        this.cdr.detectChanges(); // Met à jour l'écran
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.isLoading = false;
        this.cdr.detectChanges(); // Met à jour l'écran même en cas d'erreur
      }
    });
  }

  // --- EDIT ACTIONS ---

  startEdit(review: ReviewResponseDto): void {
    this.editingReviewId = review.id;
    this.editRating = review.rating;
    this.editComment = review.comment;
    this.cdr.detectChanges(); // Met à jour l'écran

  }

  cancelEdit(): void {
    this.editingReviewId = null;
    this.editRating = 0;
    this.editComment = '';
    this.cdr.detectChanges(); // Met à jour l'écra
  }

  setEditRating(stars: number): void {
    if (!this.isUpdating) {
      this.editRating = stars;
    }
  }

  saveEdit(review: ReviewResponseDto): void {
    if (this.editRating === 0 || !this.editComment.trim()) return;

    this.isUpdating = true;
    
    // We only need to send the fields that can change
    const updatePayload: ReviewRequestDto = {
      targetId: review.targetId,
      targetType: review.targetType,
      rating: this.editRating,
      comment: this.editComment.trim()
    };
    this.reviewSvc.updateReview(review.id, updatePayload).subscribe({
      next: (updatedReview) => {
        // Find the review in our array and replace it with the fresh data from the server
        const index = this.reviews.findIndex(r => r.id === updatedReview.id);
        if (index !== -1) {
          this.reviews[index] = updatedReview;
        }
        this.cancelEdit(); // Close the edit form
        this.isUpdating = false;
        this.cdr.detectChanges(); // Met à jour l'écran

      },
      error: (err: HttpErrorResponse) => {
        console.error('Error updating review:', err);
        if (err.status === 400 && err.error && err.error.message) {
          alert(err.error.message); 
        } else {
          alert("An error occurred while updating your review. Please try again.");
        }
        this.isUpdating = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- DELETE ACTION ---

  deleteReview(id: string): void {
    const isSure = confirm("Are you sure you want to delete this review? This action cannot be undone.");
    if (!isSure) return;

    this.reviewSvc.deleteReview(id).subscribe({
      next: () => {
        // Remove the deleted review from the UI array without reloading the whole page
        this.reviews = this.reviews.filter(r => r.id !== id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting review:', err);
        alert("An error occurred while deleting your review. Please try again.");
        this.cdr.detectChanges();
      }
    });
  }
}