import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteMap } from './components/route-map/route-map';
import { MapViewer } from './components/map-viewer/map-viewer';
import { StarRating } from './components/star-rating/star-rating';
import { Badge } from './components/badge/badge';
import { Spinner } from './components/spinner/spinner';
import { ToastComponent } from './components/toast/toast';
import { SentimentColorPipe } from './pipes/sentiment-color-pipe';
import { FormatDatePipe } from './pipes/format-date-pipe';
import { DhCurrencyPipe } from './pipes/dh-currency-pipe';
import { HasRole } from './directives/has-role';

@NgModule({
  declarations: [
    // On déplace tous les composants partagés ici
    RouteMap,
    MapViewer,
    StarRating,
    Badge,
    Spinner,
    ToastComponent,
    SentimentColorPipe,
    FormatDatePipe,
    DhCurrencyPipe,
    HasRole
  ],
  imports: [
    CommonModule
  ],
  exports: [
    // 🌟 TRÈS IMPORTANT : On les exporte pour qu'ils soient visibles ailleurs
    RouteMap,
    MapViewer,
    StarRating,
    Badge,
    Spinner,
    ToastComponent,
    SentimentColorPipe,
    FormatDatePipe,
    DhCurrencyPipe,
    HasRole,
    CommonModule // On ré-exporte CommonModule pour éviter de l'importer partout
  ]
})
export class SharedModule { }