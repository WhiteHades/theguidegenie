import { getRouterParam, readBody } from "h3";
import { setBookingManageSession } from "@/server/utils/booking-session";
import { createServerSupabaseClient } from "@/server/utils/supabase";

type SessionBody = {
  token?: string;
};

export default defineEventHandler(async (event) => {
  const bookingId = getRouterParam(event, "id");
  const body = await readBody<SessionBody>(event);
  const token = body?.token?.trim();

  if (!bookingId || !token) {
    throw createError({ statusCode: 400, statusMessage: "missing booking token" });
  }

  const supabase = createServerSupabaseClient(event);
  const { data, error } = await supabase.rpc("get_guest_booking", {
    p_booking_id: bookingId,
    p_manage_token: token,
  });

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  const booking = Array.isArray(data) ? (data[0] ?? null) : data;
  if (!booking) {
    throw createError({ statusCode: 403, statusMessage: "invalid booking token" });
  }

  setBookingManageSession(event, bookingId, token);

  return {
    bookingId,
    ok: true,
  };
});
