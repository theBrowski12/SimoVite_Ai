import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { RoleGuard } from './core/guards/role-guard';
import { Home } from './features/client/home/home';
import { GuestGuard } from '@core/guards/guest-guard';

const routes: Routes = [
  // 1️⃣ LES ROUTES SPÉCIFIQUES (Admin, Courier, Auth...)
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' },
    loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule)
  },
  {
    path: 'courier',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'COURIER' },
    loadChildren: () => import('./features/courier/courier-module').then(m => m.CourierModule)
  },
  {
    path: 'owner',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'STORE_OWNER' }, // Assure-toi que c'est bien le rôle attendu par ton RoleGuard
    loadChildren: () => import('./features/owner/owner-module').then(m => m.OwnerModule)
  },

  // 2️⃣ LA ROUTE D'ACCUEIL EXACTE
  { 
    path: '', 
    component: Home,
    canActivate: [GuestGuard],
    pathMatch: 'full' // 🌟 Très important : indique que l'URL doit être EXACTEMENT vide
  },
  
  // 3️⃣ LE MODULE CLIENT (qui gère le reste des routes publiques)
  {
    path: '',
    loadChildren: () => import('./features/client/client-module').then(m => m.ClientModule)
  },
  
  // 4️⃣ LE FALLBACK (Toujours en tout dernier !)
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }