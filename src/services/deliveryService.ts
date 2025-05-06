
import { DeliveryEntry, DeliveryType, DeliverySummary, User } from "../types";
import { format, parse, isWithinInterval } from "date-fns";
import { supabase } from "../integrations/supabase/client";

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
  try {
    const { data, error } = await supabase
      .from('delivery_types')
      .select('*')
      .order('value');
    
    if (error) throw error;
    
    return data.map(type => ({
      id: type.id,
      name: type.name,
      value: type.value,
      isExtra: type.is_extra
    }));
  } catch (error) {
    console.error('Error fetching delivery types:', error);
    return DELIVERY_TYPES;
  }
};

// Add a new delivery entry
export const addDeliveryEntry = async (entry: Omit<DeliveryEntry, "id">): Promise<DeliveryEntry> => {
  try {
    // First, create the delivery entry
    const { data: entryData, error: entryError } = await supabase
      .from('delivery_entries')
      .insert({
        user_id: entry.userId,
        date: entry.date
      })
      .select()
      .single();
    
    if (entryError) throw entryError;
    
    // Then, create all the delivery items
    const deliveryItems = entry.deliveries.map(item => ({
      entry_id: entryData.id,
      type_id: item.typeId,
      quantity: item.quantity,
      value: item.value
    }));
    
    const { error: itemsError } = await supabase
      .from('delivery_items')
      .insert(deliveryItems);
    
    if (itemsError) throw itemsError;
    
    return {
      id: entryData.id,
      date: entryData.date,
      userId: entryData.user_id,
      deliveries: entry.deliveries
    };
  } catch (error) {
    console.error('Error adding delivery entry:', error);
    
    // Fallback to local storage if Supabase fails
    const newEntry = {
      ...entry,
      id: Date.now().toString()
    };

    MOCK_DELIVERY_ENTRIES.push(newEntry);
    localStorage.setItem("deliveries", JSON.stringify(MOCK_DELIVERY_ENTRIES));
    
    return newEntry;
  }
};

// Get deliveries for a specific user
export const getUserDeliveries = async (userId: string): Promise<DeliveryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_entries')
      .select(`
        id,
        date,
        user_id,
        delivery_items (
          id,
          type_id,
          quantity,
          value
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data.map(entry => ({
      id: entry.id,
      date: entry.date,
      userId: entry.user_id,
      deliveries: entry.delivery_items.map((item: any) => ({
        typeId: item.type_id,
        quantity: item.quantity,
        value: item.value || 0
      }))
    }));
  } catch (error) {
    console.error('Error fetching user deliveries:', error);
    return MOCK_DELIVERY_ENTRIES.filter(entry => entry.userId === userId);
  }
};

// Get deliveries for a specific date range (for a user)
export const getUserDeliveriesByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<DeliveryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('delivery_entries')
      .select(`
        id,
        date,
        user_id,
        delivery_items (
          id,
          type_id,
          quantity,
          value
        )
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    
    return data.map(entry => ({
      id: entry.id,
      date: entry.date,
      userId: entry.user_id,
      deliveries: entry.delivery_items.map((item: any) => ({
        typeId: item.type_id,
        quantity: item.quantity,
        value: item.value || 0
      }))
    }));
  } catch (error) {
    console.error('Error fetching user deliveries by date range:', error);
    return MOCK_DELIVERY_ENTRIES.filter(entry => {
      return (
        entry.userId === userId &&
        entry.date >= startDate &&
        entry.date <= endDate
      );
    });
  }
};

// Get all delivery users
export const getDeliveryUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'deliverer');
    
    if (error) throw error;
    
    return data.map(profile => ({
      id: profile.id,
      email: '',  // Email is not stored in profile
      name: profile.name,
      role: profile.role as 'deliverer' | 'manager'
    }));
  } catch (error) {
    console.error('Error fetching delivery users:', error);
    return MOCK_USERS.filter(user => user.role === "deliverer");
  }
};

// Get monthly summary for all deliverers
export const getMonthlySummary = async (
  month: number,
  year: number
): Promise<DeliverySummary[]> => {
  try {
    // Calculate the period: from the 26th of previous month to the 25th of current month
    let startMonth = month - 1;
    let startYear = year;
    if (startMonth === 0) {
      startMonth = 12;
      startYear = year - 1;
    }
    
    const startDate = `${startYear}-${String(startMonth).padStart(2, "0")}-26`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-25`;
    
    // First, get all deliverers
    const users = await getDeliveryUsers();
    
    // Get all delivery types
    const types = await getDeliveryTypes();
    
    // Initialize summaries for all delivery users
    const summaryByUser: Record<string, DeliverySummary> = {};
    
    users.forEach(user => {
      summaryByUser[user.id] = {
        delivererId: user.id,
        delivererName: user.name,
        totalDeliveries: 0,
        deliveriesByType: types.map(type => ({
          typeId: type.id,
          typeName: type.name,
          quantity: 0,
          value: type.value
        })),
        totalExtras: 0,
        extraValues: 0
      };
    });
    
    // Get all deliveries for the period
    const { data: entriesData, error: entriesError } = await supabase
      .from('delivery_entries')
      .select(`
        id,
        user_id,
        delivery_items (
          type_id,
          quantity,
          value
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (entriesError) throw entriesError;
    
    // Calculate summaries
    entriesData.forEach((entry: any) => {
      const userSummary = summaryByUser[entry.user_id];
      
      if (userSummary) {
        entry.delivery_items.forEach((item: any) => {
          const typeIndex = userSummary.deliveriesByType.findIndex(
            t => t.typeId === item.type_id
          );
          
          if (typeIndex >= 0) {
            userSummary.deliveriesByType[typeIndex].quantity += item.quantity;
            
            // Check if it's an extra delivery
            const deliveryType = types.find(t => t.id === item.type_id);
            if (deliveryType?.isExtra) {
              userSummary.totalExtras += item.quantity;
              userSummary.extraValues += item.quantity * (item.value || 0);
            }
            
            userSummary.totalDeliveries += item.quantity;
          }
        });
      }
    });
    
    return Object.values(summaryByUser);
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    
    // Fallback to local storage data
    const startDate = `${year}-${String(month).padStart(2, "0")}-26`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-25`;
    
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
  }
};
