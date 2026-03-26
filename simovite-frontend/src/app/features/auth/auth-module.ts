import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './login/login';
import { Callback } from './callback/callback';

@NgModule({
  declarations: [Login, Callback],
  imports: [CommonModule, AuthRoutingModule],
})
export class AuthModule {}
