export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  storeId: string;
  available: boolean;
  storeName: string;     // 👈 Ajouté
  storeCategory: string;
  itemType: string;
  rating?: number;
  imageUrl?: string;
}