import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { ChatbotComponent } from './components/chatbot/chatbot';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
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
    ChatbotComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  exports: [
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
    CommonModule,
    ChatbotComponent,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class SharedModule {}
