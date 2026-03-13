import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthMock = vi.fn();

vi.mock("@/lib/guards/auth.guard", () => ({
  requireAuth: () => requireAuthMock(),
}));

const routeModule = await import("@/app/api/access/check/route");

describe("GET /api/access/check", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    requireAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(
        JSON.stringify({ success: false, error: { code: "UNAUTHORIZED" } }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    });

    const res = await routeModule.GET(
      new Request("http://localhost/api/access/check?cluster=cluster_1")
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 when both cluster and menu are missing", async () => {
    requireAuthMock.mockResolvedValue({
      ok: true,
      ctx: { accessLevel: "operational", jabatan: "Staff" },
    });

    const res = await routeModule.GET(
      new Request("http://localhost/api/access/check")
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns allow result for cluster and menu", async () => {
    requireAuthMock.mockResolvedValue({
      ok: true,
      ctx: { accessLevel: "operational", jabatan: "Staff" },
    });

    const res = await routeModule.GET(
      new Request(
        "http://localhost/api/access/check?cluster=cluster_6&menu=creative_live_streaming"
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.allowed.cluster).toBe(true);
    expect(json.data.allowed.menu).toBe(true);
    expect(json.data.allowed.all).toBe(true);
  });

  it("returns denied result when level has no menu access", async () => {
    requireAuthMock.mockResolvedValue({
      ok: true,
      ctx: { accessLevel: "support", jabatan: "Security" },
    });

    const res = await routeModule.GET(
      new Request(
        "http://localhost/api/access/check?cluster=cluster_6&menu=creative_live_streaming"
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.allowed.cluster).toBe(false);
    expect(json.data.allowed.menu).toBe(false);
    expect(json.data.allowed.all).toBe(false);
  });
});
