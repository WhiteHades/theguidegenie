import { describe, expect, it } from "vitest";
import { getDefaultRedirect, resolveSafeRedirect } from "./useSafeRedirect";

describe("useSafeRedirect", () => {
  it("keeps safe in-app redirects", () => {
    expect(resolveSafeRedirect("/app/dashboard")).toBe("/app/dashboard");
    expect(resolveSafeRedirect("/book/confirmation/abc")).toBe("/book/confirmation/abc");
  });

  it("falls back for unsafe redirects", () => {
    expect(resolveSafeRedirect(null)).toBe("/tours");
    expect(resolveSafeRedirect("")).toBe("/tours");
    expect(resolveSafeRedirect("https://evil.com")).toBe("/tours");
    expect(resolveSafeRedirect("//evil.com")).toBe("/tours");
    expect(resolveSafeRedirect("/api/bookings")).toBe("/tours");
  });

  it("returns role defaults", () => {
    expect(getDefaultRedirect("tourist")).toBe("/app/dashboard");
    expect(getDefaultRedirect("guide")).toBe("/guides/dashboard");
  });
});
