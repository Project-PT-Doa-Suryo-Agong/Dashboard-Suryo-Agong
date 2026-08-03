import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  getPayroll,
  updatePayroll,
  deletePayroll,
  listPayrollItems,
  replacePayrollItems,
  listKasbonByEmployee,
  updateUtangPiutang,
} from "@/lib/services/finance.service";
import { calculatePayroll, buildManualItems, type PayrollItem, type PayrollManualItemInput } from "@/lib/services/payroll.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TPayrollHistoryInsert, TPayrollItemInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

function normalizePayrollMonth(value: string): string | null {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month] = trimmed.split("-");
    return `${year}-${month}-01`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/** Parse id komposit "employee_id_bulan" dari URL. */
function parsePayrollId(id: string): { employeeId: string; bulan: string } | null {
  const [employeeId, bulanStr] = id.split("_");
  if (!employeeId || !bulanStr) return null;
  const bulan = normalizePayrollMonth(bulanStr);
  if (!bulan) return null;
  return { employeeId, bulan };
}

async function loadManualItemsFromDb(
  supabase: Parameters<typeof getPayroll>[0],
  employeeId: string,
  bulan: string,
): Promise<PayrollManualItemInput[]> {
  const { data } = await listPayrollItems(supabase, employeeId, bulan);
  return (data ?? [])
    .filter((item) => item.tipe === "manual")
    .map((item) => ({
      kode_komponen: item.kode_komponen as PayrollManualItemInput["kode_komponen"],
      jumlah: Number(item.jumlah),
      nama_komponen: item.nama_komponen,
    }));
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = parsePayrollId(id);
  if (!parsed) return fail(ErrorCode.VALIDATION_ERROR, "ID payroll tidak valid.", 400);

  const { data: payroll, error } = await getPayroll(auth.ctx.supabase, parsed.employeeId, parsed.bulan);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil detail payroll.", 500, error.message);
  if (!payroll) return fail(ErrorCode.NOT_FOUND, "Data payroll tidak ditemukan.", 404);

  const { data: items, error: itemsError } = await listPayrollItems(auth.ctx.supabase, parsed.employeeId, parsed.bulan);
  if (itemsError) return fail(ErrorCode.DB_ERROR, "Gagal mengambil detail komponen payroll.", 500, itemsError.message);

  return ok({ payroll, items: items ?? [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = parsePayrollId(id);
  if (!parsed) return fail(ErrorCode.VALIDATION_ERROR, "ID payroll tidak valid.", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }

  // ── Resolve identitas payroll (baru/berubah) ──
  let employeeId = parsed.employeeId;
  if ("employee_id" in input) {
    const v = requireUUID(input, "employee_id");
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    employeeId = v.data!;
  }

  let bulan = parsed.bulan;
  if ("bulan" in input) {
    const v = requireString(input, "bulan", { maxLen: 20 });
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    const normalized = v.data ? normalizePayrollMonth(v.data) : null;
    if (!normalized) return fail(ErrorCode.VALIDATION_ERROR, "bulan harus berupa tanggal valid.", 400);
    bulan = normalized;
  }

  const coaId = requireUUID(input, "coa_id", { optional: true });
  if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaId.message, 400);

  const total = requireNumber(input, "total", { min: 0, optional: true });
  if (!total.ok) return fail(ErrorCode.VALIDATION_ERROR, total.message, 400);

  // Override nominal BPJS per payroll (opsional; kosong = otomatis dari tarif).
  const bpjsJht = requireNumber(input, "bpjs_jht", { min: 0, optional: true });
  if (!bpjsJht.ok) return fail(ErrorCode.VALIDATION_ERROR, bpjsJht.message, 400);
  const bpjsJp = requireNumber(input, "bpjs_jp", { min: 0, optional: true });
  if (!bpjsJp.ok) return fail(ErrorCode.VALIDATION_ERROR, bpjsJp.message, 400);

  // ── Komponen manual: dari payload baru, atau dari item manual existing ──
  const hasItemsField = "items" in input;
  let manualItems: PayrollManualItemInput[];
  if (hasItemsField) {
    const parsedItems = buildManualItems(input.items);
    if (!parsedItems.ok) return fail(ErrorCode.VALIDATION_ERROR, parsedItems.message, 400);
    manualItems = parsedItems.items;
  } else {
    manualItems = await loadManualItemsFromDb(auth.ctx.supabase, parsed.employeeId, parsed.bulan);
  }

  // ── Ambil master karyawan untuk komponen auto ──
  const { data: employee } = await auth.ctx.supabase.schema("hr").from("m_karyawan")
    .select("gaji_pokok, tunjangan_tetap")
    .eq("id", employeeId)
    .single();

  // Backward-compatible legacy: PATCH lama mengirim `total` sebagai gaji pokok
  // (dipakai hanya jika payload tidak membawa items).
  const gajiPokok =
    !hasItemsField && Number(total.data ?? 0) > 0
      ? Number(total.data)
      : Number(employee?.gaji_pokok ?? 0);

  const { data: kasbonList } = await listKasbonByEmployee(auth.ctx.supabase, employeeId);
  const kasbon = (kasbonList ?? []).map((k) => ({ id: k.id, nominal: Number(k.nominal) }));

  const result = calculatePayroll({
    gajiPokok,
    tunjanganTetap: Number(employee?.tunjangan_tetap ?? 0),
    manualItems,
    kasbonList: kasbon,
    bpjsOverride: {
      jht: bpjsJht.data ?? undefined,
      jp: bpjsJp.data ?? undefined,
    },
  });
  const summary = result.summary;

  // ── Bangun payload header (kolom lama + kolom ringkas baru) ──
  const payload: TPayrollHistoryInsert = {
    employee_id: employeeId,
    bulan,
    total: summary.total,
    gaji_pokok: summary.gaji_pokok,
    potongan_kasbon: summary.potongan_kasbon,
    gaji_bersih: summary.gaji_bersih,
    gaji_kotor: summary.gaji_kotor,
    tunjangan: summary.tunjangan,
    lembur: summary.lembur,
    bonus: summary.bonus,
    insentif: summary.insentif,
    potongan_manual: summary.potongan_manual,
    bpjs_jht: summary.bpjs_jht,
    bpjs_jp: summary.bpjs_jp,
    bpjs_jkk_jkm: summary.bpjs_jkk_jkm,
  };
  if (coaId.data) payload.coa_id = coaId.data;

  const { data, error } = await updatePayroll(
    auth.ctx.supabase,
    `${parsed.employeeId}_${parsed.bulan}`,
    payload as Record<string, unknown>,
  );
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update payroll.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data payroll tidak ditemukan.", 404);

  // ── Simpan ulang detail komponen ──
  const itemRows: TPayrollItemInsert[] = (result.items as PayrollItem[]).map((item) => ({
    employee_id: employeeId,
    bulan,
    kode_komponen: item.kode_komponen,
    nama_komponen: item.nama_komponen,
    kategori: item.kategori,
    tipe: item.tipe,
    jumlah: item.jumlah,
    kasbon_id: item.kasbon_id ?? null,
    coa_id: item.coa_id ?? null,
  }));
  const { error: itemsError } = await replacePayrollItems(auth.ctx.supabase, employeeId, bulan, itemRows);
  if (itemsError) {
    console.error("PAYROLL PATCH itemsError:", itemsError);
    return fail(ErrorCode.DB_ERROR, "Gagal menyimpan detail komponen payroll.", 500, itemsError.message);
  }

  // Tandai kasbon aktif sebagai lunas (potongan kasbon lunas penuh per payroll)
  if (summary.potongan_kasbon > 0 && kasbonList) {
    for (const kasbonRow of kasbonList) {
      await updateUtangPiutang(auth.ctx.supabase, kasbonRow.id, { kas: "kas tunai" });
    }
  }

  return ok({ payroll: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = parsePayrollId(id);
  if (!parsed) return fail(ErrorCode.VALIDATION_ERROR, "ID payroll tidak valid.", 400);

  const { error, deleted } = await deletePayroll(auth.ctx.supabase, `${parsed.employeeId}_${parsed.bulan}`);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus payroll.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data payroll tidak ditemukan.", 404);
  return ok(null, "Data payroll berhasil dihapus.");
}
