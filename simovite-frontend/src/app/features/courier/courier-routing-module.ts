import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CourierLayout } from './courier-layout/courier-layout'; // 👈 IMPORT
import { Dashboard } from './dashboard/dashboard';
import { PendingDeliveries } from './pending-deliveries/pending-deliveries';
import { DeliveryPreview } from './delivery-preview/delivery-preview';
import { ActiveDelivery } from './active-delivery/active-delivery';
import { History } from './history/history';
import { Earnings } from './earnings/earnings';
import { CourierAccount } from './courier-account/courier-account';

const routes: Routes = [
  { 
    // 🌟 La route principale charge le Layout
    path: '', 
    component: CourierLayout, 
    children: [
      // 🌟 Redirection par défaut vers le dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // 🌟 Les sous-pages qui s'afficheront DANS le <router-outlet> du Layout
      { path: 'dashboard', component: Dashboard },
      { path: 'pending', component: PendingDeliveries },
      { path: 'preview/:id', component: DeliveryPreview }, 
      { path: 'active/:id', component: ActiveDelivery }, 
      { path: 'history', component: History },
      { path: 'earnings', component: Earnings },
      { path: 'account', component: CourierAccount },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CourierRoutingModule {}