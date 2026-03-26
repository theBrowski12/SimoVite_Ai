import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OwnerRoutingModule } from './owner-routing-module';
import { Dashboard } from './dashboard/dashboard';
import { Products } from './products/products';
import { Orders } from './orders/orders';
import { Reviews } from './reviews/reviews';
import { Analytics } from './analytics/analytics';
import { StoreProfile } from './store-profile/store-profile';

@NgModule({
  declarations: [Dashboard, Products, Orders, Reviews, Analytics, StoreProfile],
  imports: [CommonModule, OwnerRoutingModule],
})
export class OwnerModule {}
