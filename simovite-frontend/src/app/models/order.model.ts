import { Address } from './address.model';

// order.model.ts
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT';
export type DateFilter = 'today' | 'week' | 'month' | 'all';

// order.model.ts — ajoute ces interfaces

export interface OrderItemRequestDto {
  productId: string;
  quantity:  number;
}

export interface OrderRequestDto {
  storeId:         string;
  paymentMethod:   PaymentMethod;
  deliveryAddress: Address;
  items:           OrderItemRequestDto[];
  isPaid: boolean;
}

export interface Order {
  id: string;
  orderRef: string;
  userId: string;        
  fullName: string;      
  email: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  items: OrderItem[];
  deliveryAddress: Address;
  price: number;
  percentage: number;
  deliveryCost: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt?:string;

}
export interface OrderItem {
  productId:   string;
  productName: string;
  quantity:    number;
  unitPrice:   number;
  subTotal: number;
}
 