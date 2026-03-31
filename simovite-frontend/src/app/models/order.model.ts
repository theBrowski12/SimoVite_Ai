import { Address } from './address.model';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT';
export type DateFilter = 'today' | 'week' | 'month' | 'all';


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
 