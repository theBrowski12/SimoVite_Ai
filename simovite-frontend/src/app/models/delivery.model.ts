import { Address } from './address.model';
import type { DistancePreviewDto, OrderItemPreview, CourierLocationRequest } from './DistancePreviewDto';

export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'TRUCK';
export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

// Re-export for convenience
export type { DistancePreviewDto, OrderItemPreview, CourierLocationRequest };

export interface Delivery {
  id: number;
  orderRef: string;
  courierId?: string;
  courierName?: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  distanceInKm: number;
  deliveryCost: number;
  estimatedTimeInMinutes?: number;
  vehicleType?: VehicleType;
  cashOnDelivery: boolean;
  amountToCollect?: number;
  status: DeliveryStatus;
  storeCategory?: string;
  orderTotal?: number;
  actualDeliveryTimeInMinutes?: number;
  createdAt: string;
  updatedAt?: string;
  acceptedAt?: string; 
  deliveredAt?: string;
}
export interface DeliveryRequestDto {
  vehicleType: VehicleType;
}