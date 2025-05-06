
export interface User {
  id: string;
  email: string;
  name: string;
  role: "deliverer" | "manager";
}

export interface DeliveryType {
  id: string;
  name: string;
  value: number;
  isExtra?: boolean;
}

export interface DeliveryEntry {
  id: string;
  date: string; // ISO date string
  userId: string;
  deliveries: {
    typeId: string;
    quantity: number;
    value: number; // Only used for extras
  }[];
}

export interface DeliverySummary {
  delivererId: string;
  delivererName: string;
  totalDeliveries: number;
  deliveriesByType: {
    typeId: string;
    typeName: string;
    quantity: number;
    value: number;
  }[];
  totalExtras: number;
  extraValues: number;
}
