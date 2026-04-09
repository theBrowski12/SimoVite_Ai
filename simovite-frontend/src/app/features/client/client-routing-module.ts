import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { StoreDetailComponent } from './store-detail/store-detail';
import { Cart } from './cart/cart';
import { Reviews } from './reviews/reviews';
import { Categories } from './categories/categories';
import { ProductDetail } from './product-detail/product-detail';
import { Orders } from './orders/orders';
import { Checkout } from './checkout/checkout';
import { ClientAccount } from './client-account/client-account';
import { OrderTracking } from './order-tracking/order-tracking';

const routes: Routes = [

  { path: 'home', component: Home },
  { path: 'stores/:id', component: StoreDetailComponent },
  { path: 'cart', component: Cart },
  { path: 'my-reviews', component: Reviews },
  { path: 'categories/:categoryName', component: Categories },
  { path: 'categories', component: Categories },
  { path: 'product/:id', component: ProductDetail },
  { path: 'orders', component: Orders},
  { path: 'checkout', component: Checkout },
  { path: 'account', component: ClientAccount },
  { path: 'track/:orderRef', component: OrderTracking },

  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
