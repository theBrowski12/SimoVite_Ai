export type ReviewTargetType = 'PRODUCT' | 'STORE';
export type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'MIXED';

export interface Review {
  id: string;
  clientId: string;
  targetId: string;
  targetType: ReviewTargetType;
  comment: string;
  rating: number;
  sentiment?: Sentiment;
  sentimentScore?: number;
  sentimentAnalyzed?: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CreateReviewDto {
  clientId: string;
  targetId: string;
  targetType: ReviewTargetType;
  comment: string;
  rating: number;
}