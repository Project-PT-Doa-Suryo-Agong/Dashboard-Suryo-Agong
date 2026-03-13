import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock next/headers
vi.mock("next/headers", () => {
  const map = new Map<string, string>();
  return {
    cookies: () => ({
      get: (name: string) => {
        const v = map.get(name);
        return v !== undefined ? { value: v } : undefined;
      },
      set: (opts: { name: string; value: string }) => {
        map.set(opts.name, opts.value);
      },
    }),
  };
});

// Mock env so it doesn't throw on missing envs
vi.mock("@/lib/env", () => ({
  env: {
    supabaseUrl: "https://fake.supabase.co",
    supabaseAnonKey: "fake-anon-key",
  },
}));

// Shared mock state
const mockUser = { id: "user-123", email: "test@example.com", role: "authenticated" };
const mockProfile = {
  id: "user-123",
  nama: "Test User",
  role: "staff",
  phone: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

let mockGetUserResult: { data: { user: typeof mockUser | null }; error: Error | null };
let mockSelectResult: { data: unknown; error: Error | null };
let mockUpsertResult: { data: unknown; error: Error | null };

// Mock @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => {
    const tableApi = () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve(mockSelectResult),
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve(mockUpsertResult),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve(mockUpsertResult),
          }),
        }),
      }),
    });
    return {
      auth: {
        getUser: () => Promise.resolve(mockGetUserResult),
      },
      schema: () => ({ from: tableApi }),
      from: tableApi,
    };
  },
  createBrowserClient: () => ({}),
}));

// ─── Import route handlers (after mocks) ─────────────────────────────────────
const profileMeModule = await import("@/app/api/profile/me/route");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/profile/me", () => {
  beforeEach(() => {
    // Default: authenticated + profile exists
    mockGetUserResult = { data: { user: mockUser }, error: null };
    mockSelectResult = { data: mockProfile, error: null };
    mockUpsertResult = { data: mockProfile, error: null };
  });

  it("should return 401 when not authenticated", async () => {
    mockGetUserResult = { data: { user: null }, error: new Error("invalid token") };

    const res = await profileMeModule.GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 200 with profile data", async () => {
    const res = await profileMeModule.GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.profile).toEqual(mockProfile);
  });

  it("should return 500 on DB error", async () => {
    mockSelectResult = { data: null, error: new Error("db timeout") };

    const res = await profileMeModule.GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("DB_ERROR");
  });
});

describe("PUT /api/profile/me", () => {
  beforeEach(() => {
    mockGetUserResult = { data: { user: mockUser }, error: null };
    mockSelectResult = { data: mockProfile, error: null };
    mockUpsertResult = { data: { ...mockProfile, nama: "Updated Name" }, error: null };
  });

  it("should return 401 when not authenticated", async () => {
    mockGetUserResult = { data: { user: null }, error: new Error("no session") };

    const req = new Request("http://localhost/api/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: "Updated" }),
    });

    const res = await profileMeModule.PUT(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("should return 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    const res = await profileMeModule.PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("should return 400 if no updatable fields", async () => {
    const req = new Request("http://localhost/api/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }), // role not an allowed field
    });

    const res = await profileMeModule.PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 200 with updated profile", async () => {
    const req = new Request("http://localhost/api/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: "Updated Name" }),
    });

    const res = await profileMeModule.PUT(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.profile.nama).toBe("Updated Name");
    expect(json.data.message ?? json.message).toBeDefined();
  });

  it("should return 400 for invalid phone", async () => {
    const req = new Request("http://localhost/api/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "x".repeat(51) }),
    });

    const res = await profileMeModule.PUT(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 500 on DB error during update", async () => {
    mockUpsertResult = { data: null, error: new Error("db write error") };

    const req = new Request("http://localhost/api/profile/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: "Fail" }),
    });

    const res = await profileMeModule.PUT(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe("DB_ERROR");
  });
});
