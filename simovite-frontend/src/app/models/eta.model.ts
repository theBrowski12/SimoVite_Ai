// eta.model.ts
export interface EtaRequest {
  distance_km: number;       // Match FastAPI: distance_km
  vehicle_type: string;      // Match FastAPI: vehicle_type
  pickup_latitude: number;   // Match FastAPI: pickup_latitude
  pickup_longitude: number;  // Match FastAPI: pickup_longitude
}

export interface EtaResponse {
  estimated_minutes: number; // Match FastAPI
  distance_km: number;
  vehicle_type: string;
  weather_condition: string;
  weather_factor: number;
  rush_hour_factor: number;
  eta_percentage: number;
}