export type AppRole = 'CLIENT' | 'COURIER' | 'STORE_OWNER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: AppRole[];
}