
import { DeliveryEntry, DeliveryType, DeliverySummary, User } from "../types";
import { format } from "date-fns";

// Mock database with predefined delivery types
const DELIVERY_TYPES: DeliveryType[] = [
  { id: "1", name: "Entrega Local", value: 3.7 },
  { id: "2", name: "Entrega Padrão", value: 5 },
  { id: "3", name: "Entrega Distante", value: 7.4 },
  { id: "4", name: "Extra", value: 0, isExtra: true }
];

// Mock delivery entries (in a real app, this would come from Firebase)
let MOCK_DELIVERY_ENTRIES: DeliveryEntry[] = [];

// Mock users for delivery reports
const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "arimateia@farmacia.com",
    name: "Arimateia",
    role: "deliverer"
  },
  {
    id: "2",
    email: "ewerton@farmacia.com",
    name: "Ewerton",
    role: "deliverer"
  }
];

// Helper to initialize with some sample data
const initializeMockData = () => {
  if (localStorage.getItem("deliveries")) {
    MOCK_DELIVERY_ENTRIES = JSON.parse(localStorage.getItem("deliveries") || "[]");
    return;
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sampleDeliveries: DeliveryEntry[] = [
    {
      id: "1",
      date: format(yesterday, "yyyy-MM-dd"),
      userId: "1",
      deliveries: [
        { typeId: "1", quantity: 5, value: 3.7 },
        { typeId: "2", quantity: 2, value: 5 },
        { typeId: "4", quantity: 1, value: 10 }
      ]
    },
    {
      id: "2",
      date: format(today, "yyyy-MM-dd"),
      userId: "2",
      deliveries: [
        { typeId: "1", quantity: 3, value: 3.7 },
        { typeId: "3", quantity: 4, value: 7.4 }
      ]
    }
  ];

  localStorage.setItem("deliveries", JSON.stringify(sampleDeliveries));
  MOCK_DELIVERY_ENTRIES = sampleDeliveries;
};

// Initialize mock data
initializeMockData();

// Get all delivery types
export const getDeliveryTypes = async (): Promise<DeliveryType[]> => {
  return DELIVERY_TYPES;
};

// Add a new delivery entry
export const addDeliveryEntry = async (entry: Omit<DeliveryEntry, "id">): Promise<DeliveryEntry> => {
  const newEntry = {
    ...entry,
    id: Date.now().toString()
  };

  MOCK_DELIVERY_ENTRIES.push(newEntry);
  localStorage.setItem("deliveries", JSON.stringify(MOCK_DELIVERY_ENTRIES));
  
  return newEntry;
};

// Get deliveries for a specific user
export const getUserDeliveries = async (userId: string): Promise<DeliveryEntry[]> => {
  return MOCK_DELIVERY_ENTRIES.filter(entry => entry.userId === userId);
};

// Get deliveries for a specific date range (for a user)
export const getUserDeliveriesByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<DeliveryEntry[]> => {
  return MOCK_DELIVERY_ENTRIES.filter(entry => {
    return (
      entry.userId === userId &&
      entry.date >= startDate &&
      entry.date <= endDate
    );
  });
};

// Get all delivery users
export const getDeliveryUsers = async (): Promise<User[]> => {
  return MOCK_USERS.filter(user => user.role === "deliverer");
};

// Get monthly summary for all deliverers
export const getMonthlySummary = async (
  month: number,
  year: number
): Promise<DeliverySummary[]> => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
  
  const filteredEntries = MOCK_DELIVERY_ENTRIES.filter(entry => {
    return entry.date >= startDate && entry.date <= endDate;
  });

  const summaryByUser: Record<string, DeliverySummary> = {};

  // Initialize summaries for all delivery users
  MOCK_USERS.forEach(user => {
    if (user.role === "deliverer") {
      summaryByUser[user.id] = {
        delivererId: user.id,
        delivererName: user.name,
        totalDeliveries: 0,
        deliveriesByType: DELIVERY_TYPES.map(type => ({
          typeId: type.id,
          typeName: type.name,
          quantity: 0,
          value: type.value
        })),
        totalExtras: 0,
        extraValues: 0
      };
    }
  });

  // Calculate summaries
  filteredEntries.forEach(entry => {
    const userSummary = summaryByUser[entry.userId];
    
    if (userSummary) {
      entry.deliveries.forEach(delivery => {
        const typeIndex = userSummary.deliveriesByType.findIndex(
          t => t.typeId === delivery.typeId
        );
        
        if (typeIndex >= 0) {
          userSummary.deliveriesByType[typeIndex].quantity += delivery.quantity;
          
          if (delivery.typeId === "4") { // Extra delivery
            userSummary.totalExtras += delivery.quantity;
            userSummary.extraValues += delivery.quantity * delivery.value;
          }
          
          userSummary.totalDeliveries += delivery.quantity;
        }
      });
    }
  });

  return Object.values(summaryByUser);
};
