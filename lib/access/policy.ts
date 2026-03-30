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
  const source = normalize(role);

  if (
    source.includes("managerial") ||
    source.includes("manager") ||
    source.includes("asst ceo") ||
    source.includes("assistant ceo") ||
    source.includes("lead") ||
    source.includes("supervisor")
  ) {
    return "managerial";
  }

  if (
    source.includes("strategic") ||
    source.includes("ceo") ||
    source.includes("komisaris") ||
    source.includes("director") ||
    source.includes("owner") ||
    source.includes("admin") ||
    source.includes("developer")
  ) {
    return "strategic";
  }

  if (
    source.includes("support") ||
    source.includes("security") ||
    source.includes("maintenance") ||
    source.includes("office support") ||
    source.includes("art")
  ) {
    return "support";
  }

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
