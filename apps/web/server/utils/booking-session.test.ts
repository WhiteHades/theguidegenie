import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
  getRequestHost: vi.fn(),
  getRequestProtocol: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("h3", () => h3);

import {
  buildBookingManageLink,
  clearBookingManageSession,
  getBookingManageSession,
  setBookingManageSession,
} from "./booking-session";

describe("booking-session", () => {
  const event = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
    h3.getRequestProtocol.mockReturnValue("https");
    h3.getRequestHost.mockReturnValue("theguidegenie.com");
  });

  it("reads the booking manage cookie by booking id", () => {
    h3.getCookie.mockReturnValue("token-123");

    expect(getBookingManageSession(event, "booking-1")).toBe("token-123");
    expect(h3.getCookie).toHaveBeenCalledWith(event, "tg-booking-manage:booking-1");
  });

  it("sets the manage cookie with the expected options", () => {
    h3.getRequestProtocol.mockReturnValue("http");

    setBookingManageSession(event, "booking-1", "token-123");

    expect(h3.setCookie).toHaveBeenCalledWith(event, "tg-booking-manage:booking-1", "token-123", {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  it("clears the manage cookie with matching options", () => {
    clearBookingManageSession(event, "booking-1");

    expect(h3.deleteCookie).toHaveBeenCalledWith(event, "tg-booking-manage:booking-1", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("builds the manage link from forwarded host and protocol", () => {
    expect(buildBookingManageLink(event, "booking-1", "token-123")).toBe(
      "https://theguidegenie.com/book/confirmation/booking-1?token=token-123",
    );
  });
});
