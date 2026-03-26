import { Component, Input } from '@angular/core'; // 🌟 Ajoute Input ici

@Component({
  selector: 'app-route-map',
  standalone: false,
  templateUrl: './route-map.html',
  styleUrl: './route-map.scss',
})
export class RouteMap {
  // 🌟 Ces 3 lignes permettent à la carte de recevoir les données du livreur !
  @Input() courierPosition: any; 
  @Input() pickupAddress: any;
  @Input() dropoffAddress: any;
}