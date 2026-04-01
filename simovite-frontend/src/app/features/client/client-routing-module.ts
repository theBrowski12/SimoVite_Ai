import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { StoreDetail } from './store-detail/store-detail';

const routes: Routes = [
  
  { path: 'home', component: Home },
  { path: 'store-detail/:id', component: StoreDetail }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
