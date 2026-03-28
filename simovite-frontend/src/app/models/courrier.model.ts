export interface Courier {
  id: string;
  email: string;
  name: string;
  vehicleType: 'MOTORCYCLE' | 'CAR' | 'BICYCLE' | 'TRUCK';
  totalDeliveries: number;
  rating: number;
  completionRate: number;
  earnings: number;
  online: boolean;
  lastSeen: string;
}
