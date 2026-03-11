import { getRouterParam } from "h3";
import { clearBookingManageSession } from "@/server/utils/booking-session";

export default defineEventHandler(async (event) => {
  const bookingId = getRouterParam(event, "id");

  if (!bookingId) {
    throw createError({ statusCode: 400, statusMessage: "missing booking id" });
  }

  clearBookingManageSession(event, bookingId);

  return {
    ok: true,
  };
});
