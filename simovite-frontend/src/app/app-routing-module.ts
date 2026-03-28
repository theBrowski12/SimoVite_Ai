import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { GuestGuard } from './core/guards/guest-guard';
import { Home } from './features/client/home/home';


// Supprime tous les imports de AdminDashboard, AdminOrders, etc. ici !

const routes: Routes = [
  { path: '', component: Home, canActivate: [GuestGuard] },
  
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' },
    loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule)
  },
  
  // Reste des routes...
  { path: '**', redirectTo: 'client/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }