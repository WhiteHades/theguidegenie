import { getRouterParam } from "h3";
import { buildBookingManageLink, getBookingManageSession } from "@/server/utils/booking-session";

export default defineEventHandler(async (event) => {
  const bookingId = getRouterParam(event, "id");

  if (!bookingId) {
    throw createError({ statusCode: 400, statusMessage: "missing booking id" });
  }

  const manageToken = getBookingManageSession(event, bookingId);
  if (!manageToken) {
    throw createError({ statusCode: 404, statusMessage: "booking session missing" });
  }

  return {
    manageLink: buildBookingManageLink(event, bookingId, manageToken),
  };
});
