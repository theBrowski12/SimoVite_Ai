import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  
  // 🌟 Liste des catégories pour le HTML
  categories = [
    { name: 'Restaurants', icon: '🍔' },
    { name: 'Épicerie', icon: '🛒' },
    { name: 'Pharmacie', icon: '💊' },
    { name: 'Boulangerie', icon: '🥐' }
  ];

  // 🌟 Liste des magasins pour le HTML
  stores = [
    {
      name: 'Burger House',
      description: 'Les meilleurs burgers de la ville',
      image: 'assets/images/burger.jpg',
      rating: 4.5,
      deliveryTime: 25
    },
    {
      name: 'Sushi Zen',
      description: 'Cuisine japonaise authentique',
      image: 'assets/images/sushi.jpg',
      rating: 4.8,
      deliveryTime: 35
    }
  ];

  constructor() {}

  ngOnInit(): void {}
}