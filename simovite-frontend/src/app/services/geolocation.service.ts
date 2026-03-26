import { Injectable } from "@angular/core";
import { environment } from "@env/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Delivery } from "@models/delivery.model";
import { EtaRequest, EtaResponse } from "@models/eta.model";
import { take } from "rxjs/operators";

@Injectable({ providedIn: 'root' })
export class GeolocationService {

  watchPosition(): Observable<GpsPosition> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocation not supported');
        return;
      }
      const id = navigator.geolocation.watchPosition(
        pos => observer.next({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => observer.error(err),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(id);
    });
  }

  getCurrentPosition(): Observable<GpsPosition> {
    return this.watchPosition().pipe(take(1));
  }
}

export interface GpsPosition {
  lat: number;
  lng: number;
}