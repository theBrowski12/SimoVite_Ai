export interface EtaRequest {
  distanceKm: number;
  vehicleType: string;
  pickupLatitude: number;
  pickupLongitude: number;
}

export interface EtaResponse {
  estimatedMinutes: number;
  distanceKm: number;
  vehicleType: string;
  weatherCondition: string;
  weatherFactor: number;
  rushHourFactor: number;
}