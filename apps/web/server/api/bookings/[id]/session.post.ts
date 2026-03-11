import { getRouterParam, readBody } from "h3";
import { buildBookingManageLink, setBookingManageSession } from "@/server/utils/booking-session";

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

  setBookingManageSession(event, bookingId, token);

  return {
    bookingId,
    manageLink: buildBookingManageLink(event, bookingId, token),
  };
});
