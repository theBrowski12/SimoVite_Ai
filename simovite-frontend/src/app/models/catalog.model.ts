// catalog.model.ts

import { MainCategory, StoreResponseDto } from './store.model'; // <-- IMPORT IMPORTANT

export enum FoodCategory {
  PIZZA = 'PIZZA',
  VEGETARIAN = 'VEGETARIAN',
  BURGER = 'BURGER',
  SANDWICH = 'SANDWICH',
  TACOS = 'TACOS',
  ITALIAN = 'ITALIAN',
  ASIAN = 'ASIAN',
  MOROCCAN = 'MOROCCAN',
  MEXICAN = 'MEXICAN',
  FAST_FOOD = 'FAST_FOOD',
  SNACKS = 'SNACKS',
  PROMOTION = 'PROMOTION',
  TOP_SELLER = 'TOP_SELLER'
}

export enum PharmacyCategory {
  MEDICINE = 'MEDICINE',
  AESTHETIC = 'AESTHETIC',
  MEDICAL_EQUIPMENT = 'MEDICAL_EQUIPMENT',
  SUPPLEMENTS = 'SUPPLEMENTS',
  BABY_CARE = 'BABY_CARE',
  HYGIENE = 'HYGIENE',
  VISION = 'VISION',
  PROMOTION = 'PROMOTION',
  OTHER = 'OTHER'
}

export enum SupermarketCategory {
  BEVERAGES = 'BEVERAGES',
  GROCERY = 'GROCERY',
  PASTA_RICE = 'PASTA_RICE',
  DAIRY = 'DAIRY',
  BAKERY = 'BAKERY',
  MEAT = 'MEAT',
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  SNACKS = 'SNACKS',
  CLEANING = 'CLEANING',
  PERSONAL_CARE = 'PERSONAL_CARE',
  PROMOTION = 'PROMOTION',
  TOP_SELLER = 'TOP_SELLER'
}

export interface MenuItemExtra {
  name: string;
  additionalPrice: number;
}

export interface CatalogRequestDto {
  name: string;
  description: string;
  basePrice: number;
  available: boolean;
  storeId: string;
  imageURL?: string;
  type: MainCategory | string; // ← REQUIRED by backend for polymorphic deserialization
}

export interface CatalogResponseDto {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  available: boolean;
  type: MainCategory | string;
  rating?: number;
  reviewCount?: number;  
  storeId: string;
  imageURL?: string;
  store?: StoreResponseDto; // Utilise l'interface importée
  vegetarian?: boolean;
}

export interface RestaurantRequestDto extends CatalogRequestDto {
  foodCategories: FoodCategory[];
  availableExtras: MenuItemExtra[];
  ingredients: string[];
  vegetarian: boolean;
  allergens: string;
}

export interface PharmacyRequestDto extends CatalogRequestDto {
  requiresPrescription: boolean;
  dosage: string;
  activeIngredient: string;
  pharmacyCategories: PharmacyCategory[];
}

export interface SupermarketRequestDto extends CatalogRequestDto {
  weightInKg: number;
  supermarketCategories: SupermarketCategory[];
}

export interface SpecialDeliveryRequestDto extends CatalogRequestDto {
  pricePerKm: number;
  pricePerKg: number;
  requiredVehicleType: string;
}

export { MainCategory };
