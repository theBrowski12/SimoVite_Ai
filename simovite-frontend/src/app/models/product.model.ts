export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  storeId: string;
  available: boolean;
  itemType: string;
  rating?: number;
  imageUrl?: string;
}