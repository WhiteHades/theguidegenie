import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey);
}

export function createSupabaseServerClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const UserTypeSchema = z.enum(["tourist", "guide", "admin"]);
export const BookingStatusSchema = z.enum(["confirmed", "cancelled"]);
export const TourCategorySchema = z.enum(["free", "paid", "boat", "museum"]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  user_type: UserTypeSchema,
  name: z.string(),
  phone: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const GuideSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
  contact_email: z.string().email(),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const TourSchema = z.object({
  id: z.string().uuid(),
  guide_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  base_price_cents: z.number().nullable(),
  is_public: z.boolean(),
  category: TourCategorySchema,
  provider_name: z.string().nullable(),
  tips_enabled: z.boolean(),
  meeting_point: z.string().nullable(),
  cover_image: z.string().nullable().optional(),
  duration_minutes: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const TimeSlotSchema = z.object({
  id: z.string().uuid(),
  guide_id: z.string().uuid(),
  tour_id: z.string().uuid(),
  start_utc: z.string(),
  end_utc: z.string(),
  capacity: z.number(),
  is_open: z.boolean(),
  updated_at: z.string().optional(),
});

export const BookingSchema = z.object({
  id: z.string().uuid(),
  time_slot_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  guest_name: z.string(),
  guest_email: z.string().email(),
  guest_phone: z.string().nullable(),
  party_size: z.number(),
  status: BookingStatusSchema,
  manage_token_hash: z.string().optional(),
  cancelled_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type Guide = z.infer<typeof GuideSchema>;
export type Tour = z.infer<typeof TourSchema>;
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type UserType = z.infer<typeof UserTypeSchema>;
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
export type TourCategory = z.infer<typeof TourCategorySchema>;
