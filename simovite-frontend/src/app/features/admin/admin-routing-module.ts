import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth-guard';
import { AdminDashboard } from './dashboard/dashboard';
import { AdminLayout } from './admin-layout/admin-layout';
import { AdminOrders } from './orders/orders';
import { AdminStores } from './stores/stores';
import { AdminClientsComponent } from './clients/clients';
import { AdminKeycloak } from './keycloak/keycloak';
import { AdminProducts } from './products/products';
import { MlInsights } from './ml-insights/ml-insights';
import { Config } from './config/config';
import { AdminCouriers } from './couriers/couriers';
import { AdminDeliveries } from './deliveries/deliveries';
import { AdminReviews } from './reviews/reviews';
import { AdminStatistics } from './statistics/statistics';
import { AdminStoreOwners } from './store-owners/store-owners';
import { AdminProductDetailsComponent } from './admin-product-details/admin-product-details';
import { AdminAccount } from './admin-account/admin-account';

const routes: Routes = [
  {
    // On définit la route racine de l'admin
    path: '', 
    component: AdminLayout, // C'est lui qui contient la sidebar et le <router-outlet>
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      // Ici, on définit les pages qui s'afficheront à DROITE de la sidebar
      { path: 'dashboard',    component: AdminDashboard },
      { path: 'orders',       component: AdminOrders },
      { path: 'deliveries',   component: AdminDeliveries },
      { path: 'reviews',      component: AdminReviews },
      { path: 'stores',       component: AdminStores },
      { path: 'products',     component: AdminProducts },
      { path: 'couriers',     component: AdminCouriers },
      { path: 'clients',      component: AdminClientsComponent },
      { path: 'owners',       component: AdminStoreOwners },
      { path: 'statistics',   component: AdminStatistics },
      { path: 'ml-insights',  component: MlInsights },
      { path: 'config',       component: Config },
      { path: 'keycloak',     component: AdminKeycloak },
      { path: 'account',      component: AdminAccount },
      { path: 'products/:id', component: AdminProductDetailsComponent },
      
      // Si on tape juste /admin, on va vers /admin/dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}