import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateTo = vi.fn();
const useAuth = vi.fn();

vi.stubGlobal("defineNuxtRouteMiddleware", (fn: unknown) => fn);
vi.stubGlobal("navigateTo", navigateTo);
vi.stubGlobal("useAuth", useAuth);

function makeAuth(overrides: Partial<any> = {}) {
  return {
    initialized: { value: true },
    user: { value: { id: "user-1" } },
    fetchUser: vi.fn(),
    checkIsGuide: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

async function loadMiddleware() {
  vi.resetModules();
  return (await import("./guide-auth")).default;
}

beforeEach(() => {
  navigateTo.mockReset();
  useAuth.mockReset();
});

describe("guide-auth middleware", () => {
  it("fetches then redirects guests to guide login", async () => {
    const auth = makeAuth({
      initialized: { value: false },
      user: { value: null },
    });
    useAuth.mockReturnValue(auth);

    const middleware = await loadMiddleware();
    await middleware({ fullPath: "/guides/dashboard" });

    expect(auth.fetchUser).toHaveBeenCalledOnce();
    expect(navigateTo).toHaveBeenCalledWith("/guides/login", {
      replace: true,
      query: { redirect: "/guides/dashboard" },
    });
  });

  it("redirects signed-in non-guides to onboarding", async () => {
    useAuth.mockReturnValue(makeAuth({ checkIsGuide: vi.fn().mockResolvedValue(false) }));

    const middleware = await loadMiddleware();
    await middleware({ fullPath: "/guides/dashboard" });

    expect(navigateTo).toHaveBeenCalledWith("/guides/onboarding", {
      replace: true,
    });
  });

  it("allows guides through", async () => {
    useAuth.mockReturnValue(makeAuth());

    const middleware = await loadMiddleware();
    await middleware({ fullPath: "/guides/dashboard" });

    expect(navigateTo).not.toHaveBeenCalled();
  });
});
