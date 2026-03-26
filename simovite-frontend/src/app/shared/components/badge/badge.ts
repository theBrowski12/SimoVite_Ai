import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: false,
  template: `
    <span [style.backgroundColor]="color" class="badge">
      <ng-content></ng-content>
    </span>
  `
})
export class Badge {
  // En ajoutant 'any', on accepte le retour du Pipe de sentiment
  @Input() color: any = 'gray'; 
}