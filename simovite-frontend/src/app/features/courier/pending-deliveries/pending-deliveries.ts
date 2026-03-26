import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pending-deliveries',
  standalone: false,
  templateUrl: './pending-deliveries.html',
  styleUrl: './pending-deliveries.scss',
})
export class PendingDeliveries implements OnInit {

  // 🌟 On définit la liste que le HTML attend
  availableDeliveries = [
    {
      id: 1,
      storeName: 'Le Gourmet Burger',
      price: 45,
      distanceKm: 2.4,
      pickupAddress: { name: 'Rue 12, Quartier Gauthier' },
      dropoffAddress: { name: 'Résidence Sofia, Apt 4' }
    },
    {
      id: 2,
      storeName: 'Pizza Hot',
      price: 35,
      distanceKm: 1.1,
      pickupAddress: { name: 'Bd Zerktouni, 145' },
      dropoffAddress: { name: 'Bureau Tech Hub, 2ème étage' }
    },
    {
      id: 3,
      storeName: 'Pharmacie de Garde',
      price: 60,
      distanceKm: 4.8,
      pickupAddress: { name: 'Avenue des FAR' },
      dropoffAddress: { name: 'Villa 88, Anfa' }
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}