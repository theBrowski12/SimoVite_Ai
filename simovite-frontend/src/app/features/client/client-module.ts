import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing-module';
import { Home } from './home/home';
import { Categories } from './categories/categories';
import { StoreDetailComponent } from './store-detail/store-detail';
import { ProductDetail } from './product-detail/product-detail';
import { Cart } from './cart/cart';
import { Checkout } from './checkout/checkout';
import { Orders } from './orders/orders';
import { OrderTracking } from './order-tracking/order-tracking';
import { Reviews } from './reviews/reviews';
import { SharedModule } from '../../shared/shared.module'; // 🌟 On importe le SharedModule pour les composants partagés
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClientAccount } from './client-account/client-account';
import { ClientStores } from './client-stores/client-stores';
import { SpecialDelivery } from './special-delivery/special-delivery';
@NgModule({
  declarations: [
    Home,
    Categories,
    StoreDetailComponent,
    ProductDetail,
    Cart,
    Checkout,
    Orders,
    OrderTracking,
    Reviews,
    ClientAccount,
    ClientStores,
    SpecialDelivery,
  ],
  imports: [
    CommonModule,
    ClientRoutingModule,
    SharedModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class ClientModule {}
