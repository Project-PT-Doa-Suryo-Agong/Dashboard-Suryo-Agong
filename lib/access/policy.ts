import { MENU_CATALOG } from "@/lib/access/catalog";
import type { AccessLevel, AccessSummary, LevelClusterMap, MenuCluster } from "@/types/access";

export const LEVEL_CLUSTERS: LevelClusterMap = {
  strategic: [
    "cluster_1",
    "cluster_2",
    "cluster_3",
    "cluster_4",
    "cluster_5",
    "cluster_6",
    "cluster_7",
  ],
  managerial: [
    "cluster_1",
    "cluster_2",
    "cluster_3",
    "cluster_4",
    "cluster_5",
    "cluster_6",
    "cluster_7",
  ],
  operational: ["cluster_2", "cluster_3", "cluster_4", "cluster_5", "cluster_6"],
  support: ["cluster_7"],
};

function normalize(input: string | null | undefined) {
  return (input ?? "").trim().toLowerCase();
}

export function inferAccessLevel(role: string | null): AccessLevel {
  const normalized = (role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // 1. Strategic level
  if (
    normalized === "super-admin" ||
    normalized === "admin" ||
    normalized === "developer" ||
    normalized.includes("ceo") ||
    normalized.includes("director") ||
    normalized.includes("strategic") ||
    normalized.includes("komisaris") ||
    normalized.includes("owner") ||
    normalized.includes("admin")
  ) {
    return "strategic";
  }

  // 2. Managerial level
  if (
    normalized.includes("management") ||
    normalized.includes("manager") ||
    normalized.includes("managerial") ||
    normalized.includes("head") ||
    normalized.includes("supervisor") ||
    normalized.includes("lead") ||
    normalized.includes("asst-ceo") ||
    normalized.includes("assistant-ceo")
  ) {
    return "managerial";
  }

  // 3. Support level
  if (
    normalized.includes("support") ||
    normalized.includes("security") ||
    normalized.includes("maintenance") ||
    normalized.includes("art")
  ) {
    return "support";
  }

  // 4. Operational level (default fallback for HR, Finance, Logistics, Production, Sales, Creative)
  return "operational";
}

export function resolveJabatan(
  role: string | null,
  profileFullName: string | null,
  userJobTitle: string | null
) {
  const title = (userJobTitle ?? "").trim();
  if (title) return title;

  const roleText = (role ?? "").trim();
  if (roleText) return roleText;

  if (profileFullName && profileFullName.trim() !== "") {
    return `Staff (${profileFullName.trim()})`;
  }

  return "Staff";
}

export function getClustersForLevel(level: AccessLevel): MenuCluster[] {
  const allowed = new Set(LEVEL_CLUSTERS[level]);
  return MENU_CATALOG.filter((cluster) => allowed.has(cluster.key)).map((cluster) => ({
    ...cluster,
    menus: [...cluster.menus],
  }));
}

export function canAccessCluster(level: AccessLevel, clusterKey: string) {
  return LEVEL_CLUSTERS[level].includes(clusterKey);
}

export function canAccessMenu(level: AccessLevel, menuKey: string) {
  const allowedClusterKeys = new Set(LEVEL_CLUSTERS[level]);
  return MENU_CATALOG.some(
    (cluster) =>
      allowedClusterKeys.has(cluster.key) &&
      cluster.menus.some((menu) => menu.key === menuKey)
  );
}

export function buildAccessSummary(params: {
  role: string | null;
  division: string | null;
  fullName: string | null;
  jobTitle: string | null;
}): AccessSummary {
  const jabatan = resolveJabatan(params.role, params.fullName, params.jobTitle);
  const level = inferAccessLevel(params.role);

  return {
    level,
    jabatan,
    division: params.division,
    clusters: getClustersForLevel(level),
  };
}
