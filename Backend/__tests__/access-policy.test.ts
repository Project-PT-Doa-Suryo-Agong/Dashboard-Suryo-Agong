import { describe, expect, it } from "vitest";
import {
  canAccessCluster,
  canAccessMenu,
  getClustersForLevel,
  inferAccessLevel,
} from "@/lib/access/policy";

describe("access policy", () => {
  it("infers strategic for CEO/admin keywords", () => {
    expect(inferAccessLevel("admin")).toBe("strategic");
    expect(inferAccessLevel("CEO")).toBe("strategic");
  });

  it("infers managerial for manager keywords", () => {
    expect(inferAccessLevel("manager")).toBe("managerial");
    expect(inferAccessLevel("Asst CEO")).toBe("managerial");
  });

  it("infers support for office support keywords", () => {
    expect(inferAccessLevel("Security")).toBe("support");
  });

  it("allows support level only in cluster 7", () => {
    expect(canAccessCluster("support", "cluster_7")).toBe(true);
    expect(canAccessCluster("support", "cluster_1")).toBe(false);
  });

  it("supports menu-level checks with stable keys", () => {
    expect(canAccessMenu("operational", "creative_live_streaming")).toBe(true);
    expect(canAccessMenu("support", "creative_live_streaming")).toBe(false);
  });

  it("returns filtered cluster list by level", () => {
    const supportClusters = getClustersForLevel("support");
    expect(supportClusters).toHaveLength(1);
    expect(supportClusters[0]?.key).toBe("cluster_7");
  });
});
