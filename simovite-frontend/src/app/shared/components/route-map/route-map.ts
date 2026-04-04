import { Component, Input, OnChanges, AfterViewInit, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

// Configuration de l'icône par défaut avec tes URLs hardcodées
const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Définition de l'icône pour le livreur (bleu)
const iconCourier = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Définition de l'icône pour le pickup (vert)
const iconPickup = L.icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
// On applique cette icône globalement à tous les marqueurs Leaflet
L.Marker.prototype.options.icon = iconDefault;


@Component({
  selector: 'app-route-map',
  standalone: false,
  templateUrl: './route-map.html',
  styleUrl: './route-map.scss',
})
export class RouteMap implements AfterViewInit, OnChanges {
  @Input() courierPosition: any; 
  @Input() pickupAddress: any;
  @Input() dropoffAddress: any;

  centerOnMe(): void { // ✅ DOIT ÊTRE ICI
    if (this.courierPosition?.latitude && this.map) {
      this.map.setView([this.courierPosition.latitude, this.courierPosition.longitude], 16, {
        animate: true
      });
    }
  }

  private map!: L.Map;
  private markers: L.Marker[] = [];
  private routeLine: L.Polyline | null = null;

  ngAfterViewInit(): void {
    this.initMap();
  }

  // Dès que les coordonnées changent (GPS livreur), on met à jour les points
  ngOnChanges(changes: SimpleChanges): void {
    if (this.map) {
      this.updateMarkers();
    }
  }
  

  private initMap(): void {
    // Centre initial (Casablanca par défaut si rien n'est chargé)
    this.map = L.map('map').setView([33.5731, -7.5898], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.updateMarkers();
  }

  private updateMarkers(): void {
    // 1. Nettoyage : On enlève les anciens marqueurs ET la ligne
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const pathPoints: L.LatLng[] = [];

    // 2. Point A : Livreur (Position actuelle)
    if (this.courierPosition?.latitude) {
      const pos = L.latLng(this.courierPosition.latitude, this.courierPosition.longitude);
      const m = L.marker(pos, { icon: iconCourier }) // 👈 Utilisation de l'icône bleue
                .addTo(this.map)
                .bindPopup('<b>Moi</b><br>Ma position actuelle');
      this.markers.push(m);
      pathPoints.push(pos);
    }

    // 3. Point B : Pickup (Le Magasin)
    if (this.pickupAddress?.latitude) {
      const pos = L.latLng(this.pickupAddress.latitude, this.pickupAddress.longitude);
      const m = L.marker(pos, { icon: iconPickup })
                .addTo(this.map)
                .bindPopup('🏪 Magasin (Retrait)');
      this.markers.push(m);
      pathPoints.push(pos);
    }

    // 4. Point C : Dropoff (Le Client)
    if (this.dropoffAddress?.latitude) {
      const pos = L.latLng(this.dropoffAddress.latitude, this.dropoffAddress.longitude);
      const m = L.marker(pos).addTo(this.map).bindPopup('🏠 Client (Livraison)');
      this.markers.push(m);
      pathPoints.push(pos);
    }

    // 5. TRACÉ DE LA LIGNE (L'itinéraire)
    if (pathPoints.length > 1) {
      this.routeLine = L.polyline(pathPoints, {
        color: '#3b82f6',     // Bleu moderne
        weight: 4,            // Épaisseur
        opacity: 0.7,         // Transparence
        dashArray: '10, 10',  // Style pointillé pour montrer que c'est une estimation
        lineJoin: 'round'
      }).addTo(this.map);

      // 6. Ajustement du Zoom
      const bounds = L.latLngBounds(pathPoints);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
  public centerOnPickup(): void {
    if (this.pickupAddress?.latitude && this.map) {
      this.map.setView([this.pickupAddress.latitude, this.pickupAddress.longitude], 17, { animate: true });
    }
  }

  public centerOnDropoff(): void {
    if (this.dropoffAddress?.latitude && this.map) {
      this.map.setView([this.dropoffAddress.latitude, this.dropoffAddress.longitude], 17, { animate: true });
    }
  }
  

}