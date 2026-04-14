export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  isAdmin: number;
  createdAt: string;
}

export interface VehiclePrice {
  id: number;
  vehicleType: string;
  pricePerKm: number;
  description: string;
  updatedAt: string;
}

export interface Budget {
  id: number;
  userId: number | null;
  vehicleType: string;
  originAddress: string;
  destinationAddress: string;
  distance: number;
  basePrice: number;
  tolEstimate: number;
  totalPrice: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  createdAt: string;
}

export interface CalculateRequest {
  vehicleType: 'MUNK' | 'PRANCHA';
  pricePerKm: number;
  originAddress: string;
  destinationAddress: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface DistanceResult {
  distance: number; // em km
  duration: string;
}
