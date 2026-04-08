import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module'; // 🌟 LE VOICI
import { CourierRoutingModule } from './courier-routing-module';
import { Dashboard } from './dashboard/dashboard';
import { PendingDeliveries } from './pending-deliveries/pending-deliveries';
import { DeliveryPreview } from './delivery-preview/delivery-preview';
import { ActiveDelivery } from './active-delivery/active-delivery';
import { History } from './history/history';
import { Earnings } from './earnings/earnings';
import { CourierLayout } from './courier-layout/courier-layout';
import { CourierAccount } from './courier-account/courier-account';

@NgModule({
  declarations: [
    Dashboard,
    PendingDeliveries,
    DeliveryPreview,
    ActiveDelivery,
    History,
    Earnings,
    CourierLayout,
    CourierAccount,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CourierRoutingModule,
    FormsModule,
    TranslateModule,
    SharedModule, // 🌟 Maintenant DeliveryPreview peut voir <app-route-map> !
  ],
})
export class CourierModule {}
