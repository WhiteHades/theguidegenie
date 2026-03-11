import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
  getRouterParam: vi.fn(),
}));

const bookingSession = vi.hoisted(() => ({
  buildBookingManageLink: vi.fn(),
  getBookingManageSession: vi.fn(),
}));

const createError = vi.fn((input: { statusCode: number; statusMessage: string }) =>
  Object.assign(new Error(input.statusMessage), input),
);

vi.mock("h3", () => h3);
vi.mock("@/server/utils/booking-session", () => bookingSession);

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("createError", createError);

async function loadHandler() {
  vi.resetModules();
  return (await import("./share.get")).default;
}

describe("GET /api/bookings/:id/share", () => {
  const event = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the booking id is missing", async () => {
    h3.getRouterParam.mockReturnValue(undefined);

    const handler = await loadHandler();

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "missing booking id",
    });
  });

  it("rejects when no manage session exists", async () => {
    h3.getRouterParam.mockReturnValue("booking-1");
    bookingSession.getBookingManageSession.mockReturnValue(null);

    const handler = await loadHandler();

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "booking session missing",
    });
  });

  it("returns the shareable manage link", async () => {
    h3.getRouterParam.mockReturnValue("booking-1");
    bookingSession.getBookingManageSession.mockReturnValue("token-1");
    bookingSession.buildBookingManageLink.mockReturnValue(
      "https://example.com/book/confirmation/booking-1?token=token-1",
    );

    const handler = await loadHandler();

    await expect(handler(event)).resolves.toEqual({
      manageLink: "https://example.com/book/confirmation/booking-1?token=token-1",
    });

    expect(bookingSession.buildBookingManageLink).toHaveBeenCalledWith(event, "booking-1", "token-1");
  });
});
