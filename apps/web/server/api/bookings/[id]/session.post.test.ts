import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
  getRouterParam: vi.fn(),
  readBody: vi.fn(),
}));

const bookingSession = vi.hoisted(() => ({
  setBookingManageSession: vi.fn(),
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
  return (await import("./session.post")).default;
}

describe("POST /api/bookings/:id/session", () => {
  const event = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when the booking token is missing", async () => {
    h3.getRouterParam.mockReturnValue("booking-1");
    h3.readBody.mockResolvedValue({ token: "   " });

    const handler = await loadHandler();

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "missing booking token",
    });
  });

  it("rejects invalid tokens", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    h3.getRouterParam.mockReturnValue("booking-1");
    h3.readBody.mockResolvedValue({ token: "token-1" });
    supabase.createServerSupabaseClient.mockReturnValue({ rpc });

    const handler = await loadHandler();

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: "invalid booking token",
    });
  });

  it("stores the manage session for a valid token", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "booking-1" }],
      error: null,
    });

    h3.getRouterParam.mockReturnValue("booking-1");
    h3.readBody.mockResolvedValue({ token: " token-1 " });
    supabase.createServerSupabaseClient.mockReturnValue({ rpc });

    const handler = await loadHandler();

    await expect(handler(event)).resolves.toEqual({
      bookingId: "booking-1",
      ok: true,
    });

    expect(rpc).toHaveBeenCalledWith("get_guest_booking", {
      p_booking_id: "booking-1",
      p_manage_token: "token-1",
    });
    expect(bookingSession.setBookingManageSession).toHaveBeenCalledWith(event, "booking-1", "token-1");
  });
});
