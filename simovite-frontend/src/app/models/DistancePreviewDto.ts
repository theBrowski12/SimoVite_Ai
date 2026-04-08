import { Address } from "./address.model";

export interface CourierLocationRequest {
  latitude: number;
  longitude: number;
}

export interface OrderItemPreview {
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface DistancePreviewDto {
  deliveryId: number;
  orderRef: string;
  pickupAddress: Address;
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

  // Order items
  orderItems?: OrderItemPreview[];
  orderTotal?: number;
}