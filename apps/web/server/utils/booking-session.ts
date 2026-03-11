import { deleteCookie, getCookie, getRequestHost, getRequestProtocol, setCookie, type H3Event } from "h3";

const BOOKING_SESSION_COOKIE_PREFIX = "tg-booking-manage:";
const BOOKING_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getBookingSessionCookieName(bookingId: string) {
  return `${BOOKING_SESSION_COOKIE_PREFIX}${bookingId}`;
}

function isSecureRequest(event: H3Event) {
  return getRequestProtocol(event, { xForwardedProto: true }) === "https";
}

export function getBookingManageSession(event: H3Event, bookingId: string) {
  if (!bookingId) {
    return null;
  }

  return getCookie(event, getBookingSessionCookieName(bookingId)) ?? null;
}

export function setBookingManageSession(event: H3Event, bookingId: string, token: string) {
  if (!bookingId || !token) {
    return;
  }

  setCookie(event, getBookingSessionCookieName(bookingId), token, {
    httpOnly: true,
    maxAge: BOOKING_SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(event),
  });
}

export function clearBookingManageSession(event: H3Event, bookingId: string) {
  if (!bookingId) {
    return;
  }

  deleteCookie(event, getBookingSessionCookieName(bookingId), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(event),
  });
}

export function buildBookingManageLink(event: H3Event, bookingId: string, token: string) {
  const protocol = getRequestProtocol(event, { xForwardedProto: true });
  const host = getRequestHost(event, { xForwardedHost: true });
  const url = new URL(`/book/confirmation/${bookingId}`, `${protocol}://${host}`);

  url.searchParams.set("token", token);

  return url.toString();
}
