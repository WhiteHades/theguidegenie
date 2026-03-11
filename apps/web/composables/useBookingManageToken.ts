const BOOKING_MANAGE_TOKEN_PREFIX = "booking-manage-token:";

function canUseSessionStorage() {
  return import.meta.client && typeof window !== "undefined";
}

function getStorageKey(bookingId: string) {
  return `${BOOKING_MANAGE_TOKEN_PREFIX}${bookingId}`;
}

export function useBookingManageToken() {
  function read(bookingId: string) {
    if (!canUseSessionStorage() || !bookingId) {
      return null;
    }

    return window.sessionStorage.getItem(getStorageKey(bookingId));
  }

  function write(bookingId: string, token: string) {
    if (!canUseSessionStorage() || !bookingId || !token) {
      return;
    }

    window.sessionStorage.setItem(getStorageKey(bookingId), token);
  }

  function clear(bookingId: string) {
    if (!canUseSessionStorage() || !bookingId) {
      return;
    }

    window.sessionStorage.removeItem(getStorageKey(bookingId));
  }

  function scrubFromUrl() {
    if (!canUseSessionStorage()) {
      return;
    }

    const url = new URL(window.location.href);
    if (!url.searchParams.has("token")) {
      return;
    }

    url.searchParams.delete("token");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  return {
    read,
    write,
    clear,
    scrubFromUrl,
  };
}
