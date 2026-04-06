import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Imports des composants (vérifie bien tes chemins d'import)
import { OwnerLayout } from './owner-layout/owner-layout';
import { Dashboard } from './dashboard/dashboard';
import { Products } from './products/products';
import { Orders } from './orders/orders';
import { Reviews } from './reviews/reviews';
import { Analytics } from './analytics/analytics';
import { StoreProfile } from './store-profile/store-profile';

const routes: Routes = [
  {
    // Le composant Layout encapsule toutes les routes enfants
    path: '',
    component: OwnerLayout, 
    children: [
      // Redirection par défaut : si on tape '/owner', on va sur '/owner/dashboard'
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Les pages du Dashboard Owner
      { path: 'dashboard', component: Dashboard },
      { path: 'store-info', component: StoreProfile },
      { path: 'products', component: Products },
      { path: 'orders', component: Orders },
      { path: 'reviews', component: Reviews },
      { path: 'statistics', component: Analytics },
      
      // Ajoute les autres routes plus tard au besoin (ex: account, deliveries, categories...)
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OwnerRoutingModule {}