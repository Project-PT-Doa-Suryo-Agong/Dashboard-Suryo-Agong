import { NextResponse } from "next/server";

const RAW_IDS = process.env.CHAT_LOGS_GROUP_IDS ?? "";
const GROUP_IDS = RAW_IDS.split(",").map((s) => s.trim()).filter(Boolean);

const GROUP_NAME_MAP: Record<string, string> = {
  "120363425433038810@g.us": "SALES AGENT",
  "120363409192297413@g.us": "ABSENSI",
  "120363407670135826@g.us": "MANAGEMENT - ADMIN - FINANCE",
  "120363406825170750@g.us": "MARKETING - SOSMED",
  "120363424377551161@g.us": "SELLING - MARKETPLACE",
  "120363424509315450@g.us": "ADVERTISING",
  "120363426777266765@g.us": "BRANDING ARTIKEL - WEBSITE",
  "120363405961066852@g.us": "KONSULTAN DWC + PT DOA",
  "120363426381858397@g.us": "SOP SDM",
};

// Endpoint ini mengembalikan daftar grup dengan label — tanpa expose
// URL upstream maupun info sensitif lainnya.
export async function GET() {
  if (GROUP_IDS.length === 0) {
    return NextResponse.json(
      { error: "CHAT_LOGS_GROUP_IDS belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const groups = GROUP_IDS.map((id, index) => ({
    id,
    label: GROUP_NAME_MAP[id] ?? `Grup ${index + 1}`,
  }));

  return NextResponse.json({ groups });
}
