import { RxStomp } from '@stomp/rx-stomp';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GpsPosition } from '@models/Gpsposition.model';

declare const SockJS: any;  // ✅ use global declaration if import fails

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private stomp = new RxStomp();

  connect(token: string): void {
    this.stomp.configure({
      webSocketFactory: () => new SockJS(`${environment.wsUrl}`), // ✅ no token in URL
      connectHeaders: {
        Authorization: `Bearer ${token}`                          // ✅ in STOMP header
      },
      reconnectDelay: 5000
    });
    this.stomp.activate();
  }

  disconnect(): void {
    this.stomp.deactivate();
  }

  watchCourier(courierId: string): Observable<GpsPosition> {
    return this.stomp
      .watch(`/topic/courier/${courierId}`)
      .pipe(map(msg => JSON.parse(msg.body)));
  }

  watchDelivery(orderRef: string): Observable<any> {
    return this.stomp
      .watch(`/topic/delivery/${orderRef}`)
      .pipe(map(msg => JSON.parse(msg.body)));
  }

  sendLocation(lat: number, lng: number): void {
    this.stomp.publish({
      destination: '/app/location',
      body: JSON.stringify({ lat, lng })
    });
  }
}