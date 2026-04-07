import { Address } from "./address.model";
import { CatalogResponseDto } from "./catalog.model";

export interface Owner {
  id: string;
  email: string;
  name: string;
  storeId: string;
  //store : storeResponseDto; ? store infos are retrieved from storeId ?
  storeName: string; 
  //storeCategory: string;
  //storeAddress: Address;
  //storeComments:string;
  //storeRating: number;
  totalOrders: number;
  totalDeliveries: number;
  //storeProducts: CatalogResponseDto; ?
  earnings: number;
  online: boolean;
  lastSeen: string;
}
