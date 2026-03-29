import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { KeycloakAngularModule } from 'keycloak-angular';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { KeycloakService } from './core/auth/keycloak.service'; // 👈 UTILISE TON SERVICE ICI
import { AppRoutingModule } from './app-routing-module';
import { SharedModule } from './shared/shared.module';
// 🌟 VÉRIFIE BIEN CES IMPORTS (le nom doit correspondre à la classe dans le fichier .ts)
import { App } from './app'; 
import { Navbar } from './shared/components/navbar/navbar';
import { Sidebar } from './shared/components/sidebar/sidebar';
import { JwtInterceptor } from '@core/interceptors/jwt.interceptor';

// Fonction pour initialiser Keycloak
function initializeKeycloak(keycloak: KeycloakService) {
  return () => keycloak.init(); // Utilise la méthode init() que tu as écrite dans ton service
}

@NgModule({
  declarations: [ 
    App,    // 👈 Si erreur ici, vérifie "export class App" dans app.ts
    Navbar, // 👈 Si erreur ici, vérifie "export class Navbar" dans navbar.ts
    Sidebar 
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    SharedModule,
    KeycloakAngularModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader
      }
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    })
  ],
  bootstrap: [App],
})
export class AppModule {}