import { getRouterParam } from "h3";
import { clearBookingManageSession, getBookingManageSession } from "@/server/utils/booking-session";
import { createServerSupabaseClient } from "@/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const bookingId = getRouterParam(event, "id");

  if (!bookingId) {
    throw createError({ statusCode: 400, statusMessage: "missing booking id" });
  }

  const manageToken = getBookingManageSession(event, bookingId);
  const supabase = createServerSupabaseClient(event);
  const { data, error } = await supabase.rpc("get_booking_details", {
    p_booking_id: bookingId,
    p_manage_token: manageToken,
  });

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  const booking = Array.isArray(data) ? (data[0] ?? null) : data;
  if (!booking && manageToken) {
    clearBookingManageSession(event, bookingId);
  }

  return {
    booking,
    hasManageSession: !!booking && !!manageToken,
  };
});
