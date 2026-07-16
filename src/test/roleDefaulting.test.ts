import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * Verifies the role-defaulting logic in src/lib/roles.ts:
 *  - A Clerk-authenticated user (e.g. Google OAuth) with no
 *    publicMetadata.role defaults to "webmaster", so they can reach
 *    both /admin and /webmaster.
 *  - An explicit publicMetadata.role wins over the default.
 *  - When Clerk has no user, the local-auth role is honored.
 */

const useUserMock = vi.fn();
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => useUserMock(),
}));

import { useRole } from "@/lib/roles";

beforeEach(() => {
  useUserMock.mockReset();
  localStorage.clear();
});

describe("useRole - Clerk (Google) sign-in defaulting", () => {
  it("defaults to webmaster when Clerk user has no publicMetadata.role", () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      user: { id: "u1", publicMetadata: {} },
    });
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("webmaster");
    expect(result.current.isWebmaster).toBe(true);
  });

  it("honors an explicit publicMetadata.role over the default", () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      user: { id: "u2", publicMetadata: { role: "admin" } },
    });
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("admin");
    expect(result.current.isAdmin).toBe(true);
  });

  it("honors publicMetadata.role = fellow (non-privileged Google users)", () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      user: { id: "u3", publicMetadata: { role: "fellow" } },
    });
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("fellow");
    expect(result.current.isFellow).toBe(true);
  });

  it("falls back to local-auth role when no Clerk user present", () => {
    useUserMock.mockReturnValue({ isLoaded: true, user: null });
    localStorage.setItem(
      "local-auth",
      JSON.stringify({ signedIn: true, role: "webmaster", email: "wm@test" })
    );
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("webmaster");
  });

  it("returns fellow when neither Clerk user nor local-auth is set", () => {
    useUserMock.mockReturnValue({ isLoaded: true, user: null });
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("fellow");
  });
});
