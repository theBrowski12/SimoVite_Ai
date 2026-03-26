import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { GuestGuard } from './core/guards/guest-guard';
import { Home } from './features/client/home/home';
import { Categories } from './features/client/categories/categories';
import { StoreDetail } from './features/client/store-detail/store-detail';
import { ProductDetail } from './features/client/product-detail/product-detail';
import { Cart } from './features/client/cart/cart';
import { Checkout } from './features/client/checkout/checkout';
import { Orders } from './features/client/orders/orders';
import { Reviews } from './features/client/reviews/reviews';
import { Dashboard } from './features/courier/dashboard/dashboard';
import { PendingDeliveries } from './features/courier/pending-deliveries/pending-deliveries';
import { DeliveryPreview } from './features/courier/delivery-preview/delivery-preview';
import { ActiveDelivery } from './features/courier/active-delivery/active-delivery';
import { History } from './features/courier/history/history';
import { Earnings } from './features/courier/earnings/earnings';
import { AdminDashboard } from './features/admin/dashboard/dashboard';
import { AdminOrders } from './features/admin/orders/orders';
import { AdminDeliveries } from './features/admin/deliveries/deliveries';
import { AdminStores } from './features/admin/stores/stores';
import { AdminProducts } from './features/admin/products/products';
import { AdminClientsComponent } from './features/admin/clients/clients';
import { AdminCouriers } from './features/admin/couriers/couriers';
import { AdminStoreOwners } from './features/admin/store-owners/store-owners';
import { AdminReviews } from './features/admin/reviews/reviews';
import { AdminStatistics } from './features/admin/statistics/statistics';
import { MlInsights } from './features/admin/ml-insights/ml-insights';
import { Config } from './features/admin/config/config';
import { AdminKeycloak } from './features/admin/keycloak/keycloak';

const routes: Routes = [
  { 
    path: '', 
    component: Home, 
    canActivate: [GuestGuard] 
  },

  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth-module').then(m => m.AuthModule)
  },

  // ── CLIENT ──
  {
    path: 'client',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'CLIENT' },
    loadChildren: () =>
      import('./features/client/client-module').then(m => m.ClientModule)
  },

  // ── COURIER ──
  {
    path: 'courier',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'COURIER' },
    loadChildren: () =>
      import('./features/courier/courier-module').then(m => m.CourierModule)
  },

  // ── STORE OWNER ──
  {
    path: 'owner',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STORE_OWNER' },
    loadChildren: () =>
      import('./features/owner/owner-module').then(m => m.OwnerModule)
  },

  // ── ADMIN ──
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' },
    loadChildren: () =>
      import('./features/admin/admin-module').then(m => m.AdminModule)
  },

  { path: 'unauthorized', loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized')
        .then(c => c.Unauthorized) },

  { path: '**', redirectTo: 'client/home' }

];
  
const clientRoutes: Routes = [
  { path: 'home',          component: Home },
  { path: 'categories',    component: Categories },
  { path: 'store/:id',     component: StoreDetail },
  { path: 'product/:id',   component: ProductDetail },
  { path: 'cart',          component: Cart },
  { path: 'checkout',      component: Checkout },
  { path: 'orders',        component: Orders },
  { path: 'track/:ref',    component: Orders },
  { path: 'reviews',       component: Reviews },
];

const courierRoutes: Routes = [
  { path: 'dashboard',                  component: Dashboard },
  { path: 'pending',                    component: PendingDeliveries },
  { path: 'preview/:id',               component: DeliveryPreview },  // ← NEW
  { path: 'active/:id',                component: ActiveDelivery },
  { path: 'history',                   component: History },
  { path: 'earnings',                  component: Earnings },
];

const adminRoutes: Routes = [
  { path: '',              redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',     component: AdminDashboard },
  { path: 'orders',        component: AdminOrders },
  { path: 'deliveries',    component: AdminDeliveries },
  { path: 'stores',        component: AdminStores },
  { path: 'products',      component: AdminProducts },
  { path: 'clients',       component: AdminClientsComponent },
  { path: 'couriers',      component: AdminCouriers },
  { path: 'store-owners',  component: AdminStoreOwners },
  { path: 'reviews',       component: AdminReviews },
  { path: 'statistics',    component: AdminStatistics },
  { path: 'ml-insights',   component: MlInsights },
  { path: 'config',        component: Config },
  { path: 'keycloak',      component: AdminKeycloak },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
