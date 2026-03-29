// review.model.ts

export enum ReviewTargetType {
  PRODUCT = 'PRODUCT',
  STORE = 'STORE'
}

export interface ReviewRequestDto {
  targetId: string;
  targetType: ReviewTargetType;
  comment: string;
  rating: number; // 1 à 5
}

export interface ReviewResponseDto {
  id: string;
  targetId: string;
  targetType: ReviewTargetType;
  clientId: string;
  clientName: string;
  comment: string;
  rating: number;          
  sentiment: string;       
  sentimentScore: number;  
  sentimentAnalyzed: boolean;
  incoherent: boolean;
  createdAt: string;       
  updatedAt: string;
}