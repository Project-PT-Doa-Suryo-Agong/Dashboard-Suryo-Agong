export function shadeHex(hex: string, percent: number): string {
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return hex;

  const factor = 1 - percent / 100;
  const r = Math.round(parseInt(cleaned.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(cleaned.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(cleaned.slice(4, 6), 16) * factor);

  const toHex = (value: number) =>
    Math.min(255, Math.max(0, value)).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const EXACT_PRIMARY_HOVER: Record<string, string> = {
  "#BC934B": "#A88444",
};

export function primaryHoverColor(primary: string): string {
  const key = primary.trim().toUpperCase();
  if (EXACT_PRIMARY_HOVER[key]) return EXACT_PRIMARY_HOVER[key];
  return shadeHex(primary, 10);
}
