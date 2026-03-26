import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Delivery } from '../../../models/delivery.model';
import { EtaResponse } from '../../../models/eta.model';
import { PriceResponse } from '../../../models/price.model';
import { DeliveryService } from '../../../services/delivery.service';
import { EtaService } from '../../../services/eta.service';
import { GeolocationService, GpsPosition } from '../../../services/geolocation.service';
import { PriceService } from '../../../services/price.service';
import { calculateDistance } from '../../../helpers/gpsDistanceCalculator';
@Component({
  selector: 'app-delivery-preview',
  standalone: false,
  templateUrl: './delivery-preview.html',
  styleUrl: './delivery-preview.scss',
})
export class DeliveryPreview {
  delivery!: Delivery;
  courierGps$!: Observable<GpsPosition>;
  courierToPickup = 0;
  totalDistance = 0;
  etaPreview?: EtaResponse;
  pricePreview?: PriceResponse;
  selectedVehicle = 'MOTORCYCLE';
  vehicles = ['BICYCLE','MOTORCYCLE','CAR','TRUCK'];
  rushPeriod = '';
  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService,
    private etaService: EtaService,
    private priceService: PriceService,
    private geoService: GeolocationService,
    private router: Router
  ) {}
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.courierGps$ = this.geoService.watchPosition();

    this.deliveryService.getById(id).pipe(
      switchMap(delivery => {
        this.delivery = delivery;
        return this.courierGps$.pipe(take(1));
      }),
      switchMap(courierPos => {
        // Distance courier → pickup
        this.courierToPickup = calculateDistance(
          courierPos.lat, courierPos.lng,
          this.delivery.pickupAddress.latitude!,
          this.delivery.pickupAddress.longitude!
        );
        this.totalDistance = this.courierToPickup + this.delivery.distanceInKm!;

        // Call ETA + Price in parallel
        return forkJoin([
          this.etaService.calculate({
            distanceKm: this.totalDistance,
            vehicleType: this.selectedVehicle,
            pickupLatitude: this.delivery.pickupAddress.latitude!,
            pickupLongitude: this.delivery.pickupAddress.longitude!
          }),
          this.priceService.calculate({
            distanceKm: this.delivery.distanceInKm!,
            vehicleType: this.selectedVehicle,
            category: this.delivery.storeCategory!,
            pickupLatitude: this.delivery.pickupAddress.latitude!,
            pickupLongitude: this.delivery.pickupAddress.longitude!,
            orderTotal: this.delivery.orderTotal!
          })
        ]);
      })
    ).subscribe(([eta, price]) => {
      this.etaPreview   = eta;
      this.pricePreview = price;
    });
  }

  acceptDelivery(): void {
    const id = String(this.delivery.id!);
    this.deliveryService.accept(id, this.selectedVehicle)
      .subscribe(() => this.router.navigate(['/courier/active', id]));
  }

  goBack(): void { this.router.navigate(['/courier/pending']); }
}

