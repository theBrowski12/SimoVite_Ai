import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { StoreDetailComponent } from './store-detail/store-detail';
import { Cart } from './cart/cart';
import { Reviews } from './reviews/reviews';

const routes: Routes = [
  
  { path: 'home', component: Home },
// Change 'store-detail/:id' par 'stores/:id'
  { path: 'stores/:id', component: StoreDetailComponent },
  { path: 'cart', component: Cart },
  { path: 'my-reviews', component: Reviews },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
