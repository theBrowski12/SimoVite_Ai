import { Component, Input } from '@angular/core'; // 👈 Import de Input obligatoire

@Component({
  selector: 'app-star-rating',
  standalone: false,
  template: `
    <div class="stars">
      <span *ngFor="let star of [1,2,3,4,5]" 
            [class.filled]="star <= rating">★</span>
    </div>
  `,
  styles: [`
    .stars { color: #ccc; font-size: 1.2rem; }
    .filled { color: #FFB800; }
  `]
})
export class StarRating {
  // 🌟 C'est cette ligne qui manque !
  @Input() rating: number = 0; 
}