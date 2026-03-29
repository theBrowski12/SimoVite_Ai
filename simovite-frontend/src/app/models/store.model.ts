// store.model.ts

export enum MainCategory {
  RESTAURANT = 'RESTAURANT',
  PHARMACY = 'PHARMACY',
  SUPERMARKET = 'SUPERMARKET',
  SPECIAL_DELIVERY = 'SPECIAL_DELIVERY'
}

export interface AddressDto {
  city: string;
  street: string;
  buildingNumber: string;
  apartment: string;
  latitude: number;
  longitude: number;
}

export interface StoreRequestDto {
  name: string;
  description: string;
  category: MainCategory;
  address: AddressDto;
  phone: string;
  imageURL: string;
  open: boolean;
}

export interface StoreResponseDto {
  id: string; 
  name: string;
  description: string;
  category: MainCategory;
  address: AddressDto;
  phone: string;
  imageURL: string;
  ownerId: string;
  ownerName?: string;
  rating?: number;
  reviewCount?: number;
  open: boolean;
}