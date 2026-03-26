import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module'; // 🌟 AJOUTE CECI
import { AdminDashboard } from './dashboard/dashboard';
// ... autres imports

@NgModule({
  declarations: [
    AdminDashboard,
    // ... tes autres composants admin
  ],
  imports: [
    CommonModule,
    SharedModule, // 🌟 AJOUTE CECI : Cela donne accès aux badges, pipes et ratings !
    // ...
  ]
})
export class AdminModule { }