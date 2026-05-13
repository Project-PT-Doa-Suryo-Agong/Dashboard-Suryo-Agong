import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Variabel ini hanya ada di sisi server — tidak pernah dikirim ke browser
const API_URL = process.env.CHAT_LOGS_API_URL;

// Parse GROUP_IDs dari env (comma-separated)
const RAW_IDS = process.env.CHAT_LOGS_GROUP_IDS ?? "";
const ALLOWED_GROUP_IDS = new Set(
  RAW_IDS.split(",").map((s) => s.trim()).filter(Boolean)
);

export async function GET(request: NextRequest) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "CHAT_LOGS_API_URL belum dikonfigurasi di environment." },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const groupId = searchParams.get("group_id");

  // Validasi: group_id wajib ada dan harus ada dalam daftar yang diizinkan
  if (!groupId) {
    return NextResponse.json(
      { error: "Parameter group_id wajib diisi." },
      { status: 400 }
    );
  }

  if (!ALLOWED_GROUP_IDS.has(groupId)) {
    return NextResponse.json(
      { error: "group_id tidak diizinkan." },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(
      `${API_URL}?group_id=${encodeURIComponent(groupId)}`,
      {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.CHAT_LOGS_SUPABASE_KEY}`
        },
        cache: "no-store",
      }
    );

    const json: unknown = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream API error.", detail: json },
        { status: upstream.status }
      );
    }

    // Extract data array from upstream response
    let items: unknown[] = [];
    if (Array.isArray(json)) {
      items = json;
    } else if (Array.isArray((json as { data?: unknown[] }).data)) {
      items = (json as { data: unknown[] }).data;
    } else if (Array.isArray((json as { logs?: unknown[] }).logs)) {
      items = (json as { logs: unknown[] }).logs;
    }

    // Filter by group_id
    const filtered = items.filter(
      (item) => (item as { group_id?: string }).group_id === groupId
    );

    return NextResponse.json({ data: filtered }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
