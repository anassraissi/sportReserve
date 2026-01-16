export type UserRole = 'user' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export type ResourceType = 'room' | 'field' | 'equipment';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  description: string;
  capacity?: number;
  equipment: string[];
  images: string[];
  rules: string[];
  minDuration: number; // in minutes
  maxDuration: number; // in minutes
  pricePerHour: number;
  isActive: boolean;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly';
  totalPrice: number;
  notes?: string;
  createdAt: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  reservationId?: string;
}
