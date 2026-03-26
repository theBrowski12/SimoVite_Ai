import { Address } from './address.model';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'ONLINE';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderRef: string;
  clientId: string;
  clientName: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  items: OrderItem[];
  deliveryAddress: Address;
  totalAmount: number;
  deliveryCost: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
}