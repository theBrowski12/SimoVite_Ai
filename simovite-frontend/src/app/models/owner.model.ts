import { Address } from "./address.model";
import { CatalogResponseDto } from "./catalog.model";

export interface Owner {
  id: string;
  email: string;
  name: string;
  storeId: string;
  //storeName: string; store infos are retrieved from storeId ?
  //storeCategory: string;
  //storeAddress: Address;
  //storeComments:string;
  //storeRating: number;
  totalOrders: number;
  //storeProducts: CatalogResponseDto; ?
  earnings: number;
  online: boolean;
  lastSeen: string;
}
