// models/client.model.ts
export interface ClientStats {
  totalOrders:  number;
  totalSpent:   number;
  reviewsCount: number;
}

export interface Client {
  id:           string;
  name:         string;
  email:        string;
  enabled:      boolean;
  emailVerified:boolean;
  joinedAt:     string;
  // enrichi côté frontend via OrderService
  totalOrders:  number;
  totalSpent:   number;
  reviewsCount: number;
}