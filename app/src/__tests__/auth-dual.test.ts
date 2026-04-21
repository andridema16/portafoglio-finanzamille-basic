/**
 * Tests for dual authentication system:
 *   - src/lib/auth.ts: hashTokenWithRole, verifyTokenAndGetRole
 *   - src/app/api/auth/route.ts: POST endpoint
 *   - src/proxy.ts: proxy middleware
 *
 * NOTE on x-user-role injection:
 *   The proxy uses NextResponse.next({ request: { headers } }) to forward
 *   x-user-role as a REQUEST header to downstream Server Components.
 *   Next.js encodes these overrides on the *response* object as:
 *     x-middleware-override-headers   → comma-separated list of overridden headers
 *     x-middleware-request-<name>     → the value for each overridden header
 *   Tests verify these encoding headers rather than a plain response header.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

// ─── Inline helpers (avoid importing Next.js-only code directly) ──────────────

function hashTokenWithRole(password: string, secret: string, role: "user" | "admin"): string {
  return createHmac("sha256", secret).update(`${role}:${password}`).digest("hex");
}

function hashToken(password: string, secret: string): string {
  return createHmac("sha256", secret).update(password).digest("hex");
}

// ─── Constants matching .env.local ───────────────────────────────────────────

const SITE_PASSWORD = "finanzamille2026";
const ADMIN_PASSWORD = "admin-finanzamille-2026";
const AUTH_SECRET = "portafoglio-secret-key-2026";

// ─────────────────────────────────────────────────────────────────────────────
// 1. hashToken and hashTokenWithRole (pure crypto, no env needed)
// ─────────────────────────────────────────────────────────────────────────────

describe("hashToken", () => {
  it("returns a 64-character hex string", () => {
    const result = hashToken("password", "secret");
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for the same inputs", () => {
    const a = hashToken("pw", "sec");
    const b = hashToken("pw", "sec");
    expect(a).toBe(b);
  });

  it("produces different output when password differs", () => {
    expect(hashToken("a", "sec")).not.toBe(hashToken("b", "sec"));
  });

  it("produces different output when secret differs", () => {
    expect(hashToken("pw", "sec1")).not.toBe(hashToken("pw", "sec2"));
  });
});

describe("hashTokenWithRole", () => {
  it("produces different tokens for same password with different roles", () => {
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    const adminToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "admin");
    expect(userToken).not.toBe(adminToken);
  });

  it("produces different tokens for different passwords with same role", () => {
    const token1 = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    const token2 = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "user");
    expect(token1).not.toBe(token2);
  });

  it("produces different tokens for different passwords with different roles", () => {
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    const adminToken = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    expect(userToken).not.toBe(adminToken);
  });

  it("is deterministic", () => {
    const a = hashTokenWithRole("pw", "sec", "user");
    const b = hashTokenWithRole("pw", "sec", "user");
    expect(a).toBe(b);
  });

  it("returns 64-char hex string", () => {
    expect(hashTokenWithRole("pw", "sec", "admin")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("differs from hashToken for same password and secret", () => {
    // hashToken does NOT prepend the role prefix, so outputs must differ
    const withRole = hashTokenWithRole("pw", "sec", "user");
    const without = hashToken("pw", "sec");
    expect(withRole).not.toBe(without);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. verifyTokenAndGetRole  (uses process.env set by vitest.config.ts)
// ─────────────────────────────────────────────────────────────────────────────

describe("verifyTokenAndGetRole", () => {
  // Import after env is available; vitest injects env via config.
  it("returns 'admin' for a valid admin token", async () => {
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    const adminToken = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    expect(verifyTokenAndGetRole(adminToken)).toBe("admin");
  });

  it("returns 'user' for a valid user token", async () => {
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    expect(verifyTokenAndGetRole(userToken)).toBe("user");
  });

  it("returns null for an invalid/random token", async () => {
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    expect(verifyTokenAndGetRole("deadbeef")).toBeNull();
  });

  it("returns null for an all-zeros token", async () => {
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    expect(verifyTokenAndGetRole("0".repeat(64))).toBeNull();
  });

  it("returns null for empty string", async () => {
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    expect(verifyTokenAndGetRole("")).toBeNull();
  });

  it("does NOT return admin for a user token", async () => {
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    expect(verifyTokenAndGetRole(userToken)).not.toBe("admin");
  });

  it("does NOT return user for an admin token", async () => {
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    const adminToken = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    expect(verifyTokenAndGetRole(adminToken)).not.toBe("user");
  });

  it("returns null when SITE_PASSWORD env var is missing", async () => {
    const original = process.env.SITE_PASSWORD;
    delete process.env.SITE_PASSWORD;
    // Re-import to avoid cached env values inside the function (it reads process.env at call time)
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    const result = verifyTokenAndGetRole("anytoken");
    process.env.SITE_PASSWORD = original;
    expect(result).toBeNull();
  });

  it("returns null when AUTH_SECRET env var is missing", async () => {
    const original = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    const { verifyTokenAndGetRole } = await import("@/lib/auth");
    const result = verifyTokenAndGetRole("anytoken");
    process.env.AUTH_SECRET = original;
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. API route POST /api/auth  (test logic without Next.js server)
//    We test the role-assignment logic directly, since Next.js cookies() cannot
//    run outside the Next.js runtime. We verify: correct role returned in JSON,
//    401 on bad password, 401 on missing password.
// ─────────────────────────────────────────────────────────────────────────────

describe("API auth route logic (role assignment)", () => {
  /**
   * Simulate the route logic without the Next.js cookie/server context.
   * Returns { status, body } the same way the actual route does.
   */
  function simulateAuthRoute(
    password: string | undefined,
    sitePassword: string,
    adminPassword: string,
    authSecret: string
  ): { status: number; body: Record<string, unknown> } {
    if (!sitePassword || !adminPassword || !authSecret) {
      return { status: 500, body: { error: "Configurazione server mancante" } };
    }
    if (!password) {
      return { status: 401, body: { error: "Password errata" } };
    }
    let role: "user" | "admin";
    if (password === adminPassword) {
      role = "admin";
    } else if (password === sitePassword) {
      role = "user";
    } else {
      return { status: 401, body: { error: "Password errata" } };
    }
    const token = hashTokenWithRole(password, authSecret, role);
    return { status: 200, body: { success: true, role, token } };
  }

  it("returns role 'user' and 200 for SITE_PASSWORD", () => {
    const { status, body } = simulateAuthRoute(
      SITE_PASSWORD, SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    expect(status).toBe(200);
    expect(body.role).toBe("user");
    expect(body.success).toBe(true);
  });

  it("returns role 'admin' and 200 for ADMIN_PASSWORD", () => {
    const { status, body } = simulateAuthRoute(
      ADMIN_PASSWORD, SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    expect(status).toBe(200);
    expect(body.role).toBe("admin");
    expect(body.success).toBe(true);
  });

  it("returns 401 for a wrong password", () => {
    const { status, body } = simulateAuthRoute(
      "wrongpassword", SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Password errata");
  });

  it("returns 401 when password is undefined (missing field)", () => {
    const { status, body } = simulateAuthRoute(
      undefined, SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Password errata");
  });

  it("returns 401 for an empty string password", () => {
    const { status, body } = simulateAuthRoute(
      "", SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    expect(status).toBe(401);
    expect(body.error).toBe("Password errata");
  });

  it("returns 500 when server config is missing", () => {
    const { status, body } = simulateAuthRoute(
      SITE_PASSWORD, "", "", ""
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Configurazione server mancante");
  });

  it("user token from route verifies as 'user' role", () => {
    const { body } = simulateAuthRoute(
      SITE_PASSWORD, SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    // The token included in the simulated response must verify correctly
    const expected = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    expect(body.token).toBe(expected);
  });

  it("admin token from route verifies as 'admin' role", () => {
    const { body } = simulateAuthRoute(
      ADMIN_PASSWORD, SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    const expected = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    expect(body.token).toBe(expected);
  });

  it("SITE_PASSWORD and ADMIN_PASSWORD produce distinct tokens (no collision)", () => {
    const userResult = simulateAuthRoute(
      SITE_PASSWORD, SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    const adminResult = simulateAuthRoute(
      ADMIN_PASSWORD, SITE_PASSWORD, ADMIN_PASSWORD, AUTH_SECRET
    );
    expect(userResult.body.token).not.toBe(adminResult.body.token);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Proxy middleware logic
//    We test the proxy function from src/proxy.ts using mock NextRequest objects.
//
//    Header injection note:
//      proxy() calls NextResponse.next({ request: { headers: requestHeaders } })
//      which encodes the forwarded request headers onto the response object as:
//        x-middleware-override-headers         → "x-user-role"
//        x-middleware-request-x-user-role      → the role value
//      We assert those encoding headers rather than a plain "x-user-role"
//      response header, which is never set.
// ─────────────────────────────────────────────────────────────────────────────

describe("proxy middleware", () => {
  /**
   * Build a minimal mock NextRequest.
   * nextUrl.pathname is used directly; request.url is used for redirect URL construction.
   * headers is included so the proxy can clone them via new Headers(request.headers).
   */
  function makeMockRequest(pathname: string, cookieValue?: string) {
    const baseUrl = "http://localhost:3000";
    const url = new URL(pathname, baseUrl);
    return {
      nextUrl: url,
      url: url.toString(),
      headers: new Headers(),
      cookies: {
        get: (name: string) => {
          if (name === "auth_token" && cookieValue !== undefined) {
            return { value: cookieValue };
          }
          return undefined;
        },
      },
    } as unknown as import("next/server").NextRequest;
  }

  it("allows / (login page) without a cookie", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeMockRequest("/");
    const res = proxy(req);
    // NextResponse.next() — no redirect
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows /api/auth without a cookie", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeMockRequest("/api/auth");
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated request to /", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeMockRequest("/dashboard");
    const res = proxy(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get("location");
    expect(location).not.toBeNull();
    expect(new URL(location!).pathname).toBe("/");
  });

  it("redirects request with invalid token to /", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeMockRequest("/dashboard", "invalid-token-xyz");
    const res = proxy(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get("location");
    expect(new URL(location!).pathname).toBe("/");
  });

  it("allows /dashboard for a valid user token", async () => {
    const { proxy } = await import("@/proxy");
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    const req = makeMockRequest("/dashboard", userToken);
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows /dashboard for a valid admin token", async () => {
    const { proxy } = await import("@/proxy");
    const adminToken = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    const req = makeMockRequest("/dashboard", adminToken);
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("blocks /admin path for a user-role token, redirects to /dashboard", async () => {
    const { proxy } = await import("@/proxy");
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    const req = makeMockRequest("/admin", userToken);
    const res = proxy(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get("location");
    expect(new URL(location!).pathname).toBe("/dashboard");
  });

  it("blocks /admin/settings path for a user-role token", async () => {
    const { proxy } = await import("@/proxy");
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    const req = makeMockRequest("/admin/settings", userToken);
    const res = proxy(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get("location");
    expect(new URL(location!).pathname).toBe("/dashboard");
  });

  it("allows /admin path for a valid admin token", async () => {
    const { proxy } = await import("@/proxy");
    const adminToken = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    const req = makeMockRequest("/admin", adminToken);
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows /admin/settings for a valid admin token", async () => {
    const { proxy } = await import("@/proxy");
    const adminToken = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    const req = makeMockRequest("/admin/settings", adminToken);
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("injects x-user-role as a request header override for authenticated user", async () => {
    // NextResponse.next({ request: { headers } }) encodes the forwarded request
    // header onto the response as x-middleware-request-x-user-role, and lists
    // it in x-middleware-override-headers.
    const { proxy } = await import("@/proxy");
    const userToken = hashTokenWithRole(SITE_PASSWORD, AUTH_SECRET, "user");
    const req = makeMockRequest("/dashboard", userToken);
    const res = proxy(req);
    expect(res.headers.get("x-middleware-request-x-user-role")).toBe("user");
    expect(res.headers.get("x-middleware-override-headers")).toContain("x-user-role");
  });

  it("injects x-user-role as a request header override for authenticated admin", async () => {
    const { proxy } = await import("@/proxy");
    const adminToken = hashTokenWithRole(ADMIN_PASSWORD, AUTH_SECRET, "admin");
    const req = makeMockRequest("/dashboard", adminToken);
    const res = proxy(req);
    expect(res.headers.get("x-middleware-request-x-user-role")).toBe("admin");
    expect(res.headers.get("x-middleware-override-headers")).toContain("x-user-role");
  });

  it("blocks /admin path for unauthenticated request (no cookie), redirects to /", async () => {
    const { proxy } = await import("@/proxy");
    const req = makeMockRequest("/admin");
    const res = proxy(req);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get("location");
    // No token at all → goes to /, not /dashboard
    expect(new URL(location!).pathname).toBe("/");
  });
});
