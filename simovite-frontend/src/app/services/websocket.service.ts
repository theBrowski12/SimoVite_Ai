// services/websocket.service.ts
import { RxStomp } from '@stomp/rx-stomp';
import { Injectable } from "@angular/core";
import { environment } from "@env/environment";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { GpsPosition } from '@models/Gpsposition.model';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private stomp = new RxStomp();

  connect(token: string): void {
    this.stomp.configure({
      brokerURL:    `${environment.wsUrl}?token=${token}`,
      reconnectDelay: 5000
    });
    this.stomp.activate();
  }

  watchCourier(courierId: string): Observable<GpsPosition> {
    return this.stomp
      .watch(`/topic/courier/${courierId}`)
      .pipe(map(msg => JSON.parse(msg.body)));
  }

  sendLocation(lat: number, lng: number): void {
    this.stomp.publish({
      destination: '/app/location',
      body: JSON.stringify({ lat, lng })
    });
  }
}