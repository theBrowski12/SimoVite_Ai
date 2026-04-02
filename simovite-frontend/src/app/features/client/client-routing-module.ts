import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { StoreDetailComponent } from './store-detail/store-detail';
import { Cart } from './cart/cart';
import { Reviews } from './reviews/reviews';
import { Categories } from './categories/categories';

const routes: Routes = [
  
  { path: 'home', component: Home },
  { path: 'stores/:id', component: StoreDetailComponent },
  { path: 'cart', component: Cart },
  { path: 'my-reviews', component: Reviews },
  { path: 'categories', component: Categories },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
