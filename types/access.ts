export type AccessLevel =
  | "strategic"
  | "managerial"
  | "operational"
  | "support";

export type MenuItem = {
  key: string;
  title: string;
};

export type MenuCluster = {
  key: string;
  title: string;
  menus: MenuItem[];
};

export type LevelClusterMap = Record<AccessLevel, string[]>;

export type AccessSummary = {
  level: AccessLevel;
  jabatan: string;
  division: string | null;
  clusters: MenuCluster[];
};
