import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module'; // 🌟 AJOUTE CECI
import { AdminDashboard } from './dashboard/dashboard';
import { Sidebar } from './sidebar/sidebar';
import { AdminLayout } from './admin-layout/admin-layout';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing-module';
import { AuthService } from '@core/auth/auth.service';
import { AdminOrders } from './orders/orders';
import { AdminDeliveries } from './deliveries/deliveries';
import { AdminReviews } from './reviews/reviews';
import { AdminStores } from './stores/stores';
import { AdminProducts } from './products/products';
import { AdminCouriers } from './couriers/couriers';
import { AdminStoreOwners } from './store-owners/store-owners';
import { AdminStatistics } from './statistics/statistics';
import { MlInsights } from './ml-insights/ml-insights';
import { Config } from './config/config';
import { AdminKeycloak } from './keycloak/keycloak';
import { AdminClientsComponent } from './clients/clients';
import { FormsModule } from '@angular/forms';
// ... autres imports

@NgModule({
  declarations: [
    AdminDashboard, Sidebar, AdminLayout,
    AdminOrders, AdminDeliveries, AdminReviews, AdminStores,
    AdminProducts, AdminCouriers, AdminClientsComponent, AdminStoreOwners,
    AdminStatistics, MlInsights, Config, AdminKeycloak
  
  ],
  imports: [
    CommonModule,
    SharedModule, 
    RouterModule,
    AdminRoutingModule,
    FormsModule,
    // ...
  ]
})
export class AdminModule {}
