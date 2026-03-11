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
    checkIsGuide: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

async function loadMiddleware() {
  vi.resetModules();
  return (await import("./tourist-auth")).default;
}

beforeEach(() => {
  navigateTo.mockReset();
  useAuth.mockReset();
});

describe("tourist-auth middleware", () => {
  it("fetches then redirects guests to tourist login", async () => {
    const auth = makeAuth({
      initialized: { value: false },
      user: { value: null },
    });
    useAuth.mockReturnValue(auth);

    const middleware = await loadMiddleware();
    await middleware({ fullPath: "/app/dashboard" });

    expect(auth.fetchUser).toHaveBeenCalledOnce();
    expect(navigateTo).toHaveBeenCalledWith("/auth/tourist/login", {
      replace: true,
      query: { redirect: "/app/dashboard" },
    });
  });

  it("redirects guides to the guide dashboard", async () => {
    useAuth.mockReturnValue(makeAuth({ checkIsGuide: vi.fn().mockResolvedValue(true) }));

    const middleware = await loadMiddleware();
    await middleware({ fullPath: "/app/dashboard" });

    expect(navigateTo).toHaveBeenCalledWith("/guides/dashboard", {
      replace: true,
    });
  });

  it("allows authenticated tourists through", async () => {
    useAuth.mockReturnValue(makeAuth());

    const middleware = await loadMiddleware();
    await middleware({ fullPath: "/app/dashboard" });

    expect(navigateTo).not.toHaveBeenCalled();
  });
});
