import { NextResponse } from "next/server";

const RAW_IDS = process.env.CHAT_LOGS_GROUP_IDS ?? "";
const GROUP_IDS = RAW_IDS.split(",").map((s) => s.trim()).filter(Boolean);

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
    label: `Grup ${index + 1}`,
  }));

  return NextResponse.json({ groups });
}
