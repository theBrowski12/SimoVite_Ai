export interface PriceRequest {
  distanceKm: number;
  vehicleType: string;
  category: string;
  pickupLatitude: number;
  pickupLongitude: number;
  orderTotal: number;
}

export interface PriceResponse {
  deliveryCost: number;
  distanceKm: number;
  vehicleType: string;
  category: string;
  weatherCondition: string;
  weatherFactor: number;
  rushHourFactor: number;
}