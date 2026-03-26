import { Address } from './address.model';

export interface Store {
  id: string;
  name: string;
  category: 'RESTAURANT' | 'PHARMACY' | 'SUPERMARKET' | 'SPECIAL_DELIVERY';
  ownerId: string;
  ownerName: string;
  address: Address;
  available: boolean;
  rating?: number;
  reviewCount?: number;
}