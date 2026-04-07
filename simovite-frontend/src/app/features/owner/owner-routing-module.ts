import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OwnerLayout } from './owner-layout/owner-layout';
import { Dashboard } from './dashboard/dashboard';
import { Products } from './products/products';
import { Orders } from './orders/orders';
import { Reviews } from './reviews/reviews';
import { Analytics } from './analytics/analytics';
import { StoreProfile } from './store-profile/store-profile';
import { Deliveries } from './deliveries/deliveries';

const routes: Routes = [
  {
    path: '',
    component: OwnerLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'store-info', component: StoreProfile },
      { path: 'products', component: Products },
      { path: 'orders', component: Orders },
      { path: 'reviews', component: Reviews },
      { path: 'statistics', component: Analytics },
      { path: 'deliveries', component: Deliveries },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OwnerRoutingModule {}