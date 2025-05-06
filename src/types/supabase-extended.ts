
import type { Database } from "../integrations/supabase/types";
import { DeliveryType, User } from "../types";

// Type helpers for Supabase tables
export type DbDeliveryType = Database["public"]["Tables"]["delivery_types"]["Row"];
export type DbDeliveryEntry = Database["public"]["Tables"]["delivery_entries"]["Row"];
export type DbDeliveryItem = Database["public"]["Tables"]["delivery_items"]["Row"];
export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];

// Mapping functions to convert between DB types and application types
export const mapDbDeliveryTypeToAppType = (dbType: DbDeliveryType): DeliveryType => ({
  id: dbType.id,
  name: dbType.name,
  value: dbType.value,
  isExtra: dbType.is_extra
});

export const mapDbProfileToUser = (profile: DbProfile): User => ({
  id: profile.id,
  name: profile.name,
  role: profile.role as "deliverer" | "manager",
  email: '' // Email is not stored in the profile table
});
