import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
  getRouterParam: vi.fn(),
}));

const bookingSession = vi.hoisted(() => ({
  clearBookingManageSession: vi.fn(),
  getBookingManageSession: vi.fn(),
}));

const supabase = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

const createError = vi.fn((input: { statusCode: number; statusMessage: string }) =>
  Object.assign(new Error(input.statusMessage), input),
);

vi.mock("h3", () => h3);
vi.mock("@/server/utils/booking-session", () => bookingSession);
vi.mock("@/server/utils/supabase", () => supabase);

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("createError", createError);

async function loadHandler() {
  vi.resetModules();
  return (await import("./[id].get")).default;
}

describe("GET /api/bookings/:id", () => {
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

  it("returns the booking and manage session state", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "booking-1" }],
      error: null,
    });

    h3.getRouterParam.mockReturnValue("booking-1");
    bookingSession.getBookingManageSession.mockReturnValue("token-1");
    supabase.createServerSupabaseClient.mockReturnValue({ rpc });

    const handler = await loadHandler();

    await expect(handler(event)).resolves.toEqual({
      booking: { id: "booking-1" },
      hasManageSession: true,
    });

    expect(rpc).toHaveBeenCalledWith("get_booking_details", {
      p_booking_id: "booking-1",
      p_manage_token: "token-1",
    });
  });

  it("clears a stale manage session when no booking is returned", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    h3.getRouterParam.mockReturnValue("booking-1");
    bookingSession.getBookingManageSession.mockReturnValue("token-1");
    supabase.createServerSupabaseClient.mockReturnValue({ rpc });

    const handler = await loadHandler();

    await expect(handler(event)).resolves.toEqual({
      booking: null,
      hasManageSession: false,
    });

    expect(bookingSession.clearBookingManageSession).toHaveBeenCalledWith(event, "booking-1");
  });
});
