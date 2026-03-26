import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-route-map',
  standalone: false,
  templateUrl: './route-map.html',
  styleUrl: './route-map.scss'
})
export class RouteMap implements OnInit, OnChanges {
  @Input() courierPosition: any; 
  @Input() pickupAddress: any;
  @Input() dropoffAddress: any;

  private map!: L.Map;

  ngOnInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si la position du livreur change, on met à jour le marqueur
    if (this.map && changes['courierPosition'] && this.courierPosition) {
      this.updateMarkers();
    }
  }

  private initMap() {
    this.map = L.map('map').setView([33.5731, -7.5898], 13); // Centré sur Casablanca par défaut

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private updateMarkers() {
    // Nettoyer la carte et ajouter les icônes de Livreur, Shop et Client
    // (Je peux t'aider pour les icônes personnalisées si tu veux !)
    const courierIcon = L.icon({ iconUrl: 'assets/icons/courier.png', iconSize: [32, 32] });
    
    L.marker([this.courierPosition.lat, this.courierPosition.lng], { icon: courierIcon })
      .addTo(this.map)
      .bindPopup('Votre position');
  }
}