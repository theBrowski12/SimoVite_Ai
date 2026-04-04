export interface PriceRequest {
  distance_km: number;
  vehicle_type: string;
  category: string;
  pickup_latitude: number;
  pickup_longitude: number;
  order_total: number;       // Match FastAPI: order_total
}

export interface PriceResponse {
  delivery_cost: number;     // Match FastAPI: delivery_cost
  distance_km: number;
  vehicle_type: string;
  category: string;
  weather_condition: string;
  weather_factor: number;
  rush_hour_factor: number;
  break_down: any;           // Match FastAPI: breakdown
  price_percentage: number;
}