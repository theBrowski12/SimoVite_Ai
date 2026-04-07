import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { OwnerRoutingModule } from './owner-routing-module';
import { Dashboard } from './dashboard/dashboard';
import { Products } from './products/products';
import { Orders } from './orders/orders';
import { Reviews } from './reviews/reviews';
import { Analytics } from './analytics/analytics';
import { StoreProfile } from './store-profile/store-profile';
import { OwnerLayout } from './owner-layout/owner-layout';
import { Deliveries } from './deliveries/deliveries';
import { Account } from './account/account';

@NgModule({
  declarations: [
    Dashboard,
    Products,
    Orders,
    Reviews,
    Analytics,
    StoreProfile,
    OwnerLayout,
    Deliveries,
    Account,
  ],
  imports: [CommonModule, OwnerRoutingModule, ReactiveFormsModule, FormsModule],
})
export class OwnerModule {}
