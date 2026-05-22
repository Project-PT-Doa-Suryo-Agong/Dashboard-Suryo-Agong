import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ─── GET: List all memberships ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 200);
    const from = (page - 1) * limit;

    const supabase = await createSupabaseServerClient();
    const db = (supabase as any).schema("sales");

    const { data, error, count } = await db
      .from("t_membership")
      .select("*", { count: "exact" })
      .order("nama", { ascending: true })
      .range(from, from + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        membership: data ?? [],
        meta: { page, limit, total: count ?? 0 },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new membership ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, telepon, lokasi } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { success: false, error: { message: "Nama pelanggan wajib diisi." } },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const db = (supabase as any).schema("sales");

    const { data, error } = await db
      .from("t_membership")
      .insert({ nama: nama.trim(), telepon: telepon?.trim() || null, lokasi: lokasi?.trim() || null })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { membership: data } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}

// ─── PUT: Update an existing membership ─────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nama, telepon, lokasi } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "ID wajib dikirim." } },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const db = (supabase as any).schema("sales");

    const { data, error } = await db
      .from("t_membership")
      .update({ nama: nama?.trim(), telepon: telepon?.trim() || null, lokasi: lokasi?.trim() || null })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { membership: data } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}

// ─── DELETE: Remove a membership ────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: "ID wajib dikirim." } },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const db = (supabase as any).schema("sales");

    const { error } = await db.from("t_membership").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
