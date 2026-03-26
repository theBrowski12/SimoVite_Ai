export interface SentimentRequest {
  comment: string;
  rating: number;
}

export interface SentimentResponse {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'MIXED';
  score: number;
  confidence: number;
  incoherent: boolean;
  alert: string;
}