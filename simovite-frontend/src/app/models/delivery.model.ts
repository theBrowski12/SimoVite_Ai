import { Address } from './address.model';

export type VehicleType = 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'TRUCK';
export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED';

export interface Delivery {
  id: number;
  orderRef: string;
  courierId?: string;
  courierName?: string;
  customerEmail?: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  distanceInKm?: number;
  deliveryCost?: number;
  estimatedTimeInMinutes?: number;
  vehicleType?: VehicleType;
  cashOnDelivery: boolean;
  amountToCollect?: number;
  status: DeliveryStatus;
  storeCategory?: string;
  orderTotal?: number;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
}