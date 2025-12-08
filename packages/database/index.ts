// guidegenie supabase database client and types
import { createClient } from '@supabase/supabase-js'
import { z } from "zod";

// supabase client factory - call with env vars
export function createSupabaseClient(url: string, anonKey: string) {
    return createClient(url, anonKey)
}

// server-side client with service role
export function createSupabaseServerClient(url: string, serviceRoleKey: string) {
    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// guidegenie-specific types (matching our supabase schema)
export const UserTypeSchema = z.enum(['tourist', 'guide', 'admin']);
export const BookingStatusSchema = z.enum(['confirmed', 'cancelled']);

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
});

export const TourCategorySchema = z.enum(['free', 'paid', 'boat', 'museum']);

export const TourSchema = z.object({
    id: z.string().uuid(),
    guide_id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    base_price_cents: z.number().nullable(),
    is_public: z.boolean(),
    category: TourCategorySchema.default('paid'),
    provider_name: z.string().nullable(),
    tips_enabled: z.boolean().default(false),
    meeting_point: z.string().nullable(),
    created_at: z.string(),
});

export const TimeSlotSchema = z.object({
    id: z.string().uuid(),
    guide_id: z.string().uuid(),
    start_utc: z.string(),
    end_utc: z.string(),
    capacity: z.number(),
    is_open: z.boolean(),
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
    edit_token: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

// type exports
export type User = z.infer<typeof UserSchema>;
export type Guide = z.infer<typeof GuideSchema>;
export type Tour = z.infer<typeof TourSchema>;
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type UserType = z.infer<typeof UserTypeSchema>;
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

// legacy compatibility exports for existing code (temporary)
export const UserRoleSchema = z.enum(["user", "admin"]);
export const TeamSchema = z.object({ id: z.string(), name: z.string() });
export const TeamMemberRoleSchema = z.enum(["owner", "admin", "member"]);
export const TeamMembershipSchema = z.object({
    id: z.string(),
    userId: z.string(),
    teamId: z.string(),
    role: TeamMemberRoleSchema,
});
export const SubscriptionSchema = z.object({ id: z.string(), status: z.string() });
export const UserOneTimePasswordTypeSchema = z.enum(["email_verification", "password_reset"]);

export type UserSession = { id: string; userId: string };
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type SubscriptionStatusType = string;
export type UserOneTimePasswordTypeType = z.infer<typeof UserOneTimePasswordTypeSchema>;

// stub db for legacy code
export const db = {} as any;
