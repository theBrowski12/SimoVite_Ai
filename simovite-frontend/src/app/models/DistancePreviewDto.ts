import { Address } from "./address.model";

// delivery.model.ts
export interface CourierLocationRequest {
  latitude: number;
  longitude: number;
}

export interface DistancePreviewDto {
  deliveryId: number;
  orderRef: string;
  pickupAddress: Address; // Utilise ton interface Address si tu en as une
  dropoffAddress: Address;
  distanceToPickupKm: number;
  distancePickupToDropoffKm: number;
  totalDistanceKm: number;
  deliveryCost: number;
  cashOnDelivery: boolean;
  amountToCollect: number;
  estimatedEtaMinutes: number;
  etaPercentage: number;
  vehicleType: string;
  status: string;
}