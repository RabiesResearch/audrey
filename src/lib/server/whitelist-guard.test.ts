import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RequestEvent } from "@sveltejs/kit";

// Mock the PMP module so we control the whitelist decision without any network
// or $env access. This also means pmp.ts is never loaded by these tests.
vi.mock("./pmp", () => ({
  isEmailWhitelisted: vi.fn(),
}));

import { whitelistGuard } from "./whitelist-guard";
import { isEmailWhitelisted } from "./pmp";

const allowed = vi.mocked(isEmailWhitelisted);

// Build a minimal RequestEvent stub with just what the guard reads.
function makeEvent(pathname: string, email: string | null): RequestEvent {
  return {
    url: new URL(`http://localhost${pathname}`),
    locals: {
      auth: async () => (email ? { user: { email } } : null),
    },
  } as unknown as RequestEvent;
}

describe("whitelistGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets /login through without checking the whitelist", async () => {
    const resolve = vi.fn().mockResolvedValue("ok");
    await whitelistGuard({ event: makeEvent("/login", "x@y.com"), resolve });
    expect(resolve).toHaveBeenCalledOnce();
    expect(allowed).not.toHaveBeenCalled();
  });

  it("lets /auth/* through without checking the whitelist", async () => {
    const resolve = vi.fn().mockResolvedValue("ok");
    await whitelistGuard({
      event: makeEvent("/auth/callback/google", "x@y.com"),
      resolve,
    });
    expect(resolve).toHaveBeenCalledOnce();
    expect(allowed).not.toHaveBeenCalled();
  });

  it("passes through when there is no session", async () => {
    const resolve = vi.fn().mockResolvedValue("ok");
    await whitelistGuard({ event: makeEvent("/", null), resolve });
    expect(resolve).toHaveBeenCalledOnce();
    expect(allowed).not.toHaveBeenCalled();
  });

  it("resolves for a whitelisted user", async () => {
    allowed.mockResolvedValue(true);
    const resolve = vi.fn().mockResolvedValue("ok");
    await whitelistGuard({ event: makeEvent("/", "ok@y.com"), resolve });
    expect(allowed).toHaveBeenCalledWith("ok@y.com");
    expect(resolve).toHaveBeenCalledOnce();
  });

  it("throws 403 for a logged-in non-whitelisted user", async () => {
    allowed.mockResolvedValue(false);
    const resolve = vi.fn();
    await expect(
      whitelistGuard({ event: makeEvent("/", "no@y.com"), resolve }),
    ).rejects.toMatchObject({ status: 403 });
    expect(resolve).not.toHaveBeenCalled();
  });
});
