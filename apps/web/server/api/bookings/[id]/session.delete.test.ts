import { beforeEach, describe, expect, it, vi } from "vitest";

const h3 = vi.hoisted(() => ({
  getRouterParam: vi.fn(),
}));

const bookingSession = vi.hoisted(() => ({
  clearBookingManageSession: vi.fn(),
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
  return (await import("./session.delete")).default;
}

describe("DELETE /api/bookings/:id/session", () => {
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

  it("clears the manage session", async () => {
    h3.getRouterParam.mockReturnValue("booking-1");

    const handler = await loadHandler();

    await expect(handler(event)).resolves.toEqual({ ok: true });
    expect(bookingSession.clearBookingManageSession).toHaveBeenCalledWith(event, "booking-1");
  });
});
