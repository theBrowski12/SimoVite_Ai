import { Address } from './address.model';
import { AddressDto } from './store.model';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT';
export type DateFilter = 'today' | 'week' | 'month' | 'all';

// 🚦 NOUVEAU : Indispensable pour différencier l'affichage dans l'historique
export type OrderType = 'REGULAR' | 'SPECIAL_DELIVERY';

export interface OrderItemRequestDto {
  productId: string;
  quantity:  number;
}

export interface OrderRequestDto {
  storeId:         string;
  paymentMethod:   PaymentMethod;
  deliveryAddress: Address;
  items:           OrderItemRequestDto[];
  isPaid:          boolean;
}

export interface SpecialDeliveryRequestDto {
  catalogSpecialDeliveryId: string; // e.g., "id-for-motorcycle-delivery"
  productName?: string;

  // Delivery Company Details
  storeId: string;

  // Transactional Data
  pickupAddress: AddressDto; 
  dropoffAddress: AddressDto;

  // 💰 AJOUTÉ : Pour que l'utilisateur puisse choisir comment payer
  paymentMethod?: PaymentMethod;

  // User Data
  senderId?: string; // Optional if the user isn't logged in
  senderName: string;
  senderPhone: string;
  instructions?: string;

  receiverName: string;
  receiverPhone: string;
  
  productPhotoUrls?: string[];

  // Package Details
  totalWeightKg: number;
}

export interface SpecialDeliveryResponseDto {
  id: number;
  orderRef: string;
  status: OrderStatus;

  // Package Info
  productName?: string;
  totalWeightKg?: number;
  productPhotoUrls?: string[];
  instructions?: string;

  // Addresses
  pickUpAddress: Address; 
  deliveryAddress: Address; 
  calculatedDistanceKm?: number;

  // Logistics & Store
  storeId: string;
  storeName?: string;
  storeCategory?: string;
  storePhone?: string;

  // People
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;

  // Money
  deliveryCost: number;
  price: number;
  paymentMethod: PaymentMethod | string; 

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderRef: string;
  orderType?: OrderType; // 🚦 AJOUTÉ : Permet de faire des *ngIf dans le HTML
  userId: string;
  fullName: string;
  email: string;
  customerPhone?: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  
  // ⚠️ CORRIGÉ : Rendu optionnel (?) pour éviter que l'historique crash sur les colis
  items?: OrderItem[]; 
  
  deliveryAddress: Address;
  price: number;
  percentage: number;
  deliveryCost: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;

  // 📦 AJOUTÉ : Champs optionnels pour afficher les infos colis dans l'historique global
  pickUpAddress?: Address;
  productName?: string;
  totalWeightKg?: number;
  senderName?: string;
  receiverName?: string;
}

export interface OrderItem {
  productId:   string;
  productName: string;
  quantity:    number;
  unitPrice:   number;
  subTotal:    number;
}