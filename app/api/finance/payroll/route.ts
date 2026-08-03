import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listPayroll, createPayroll, listKasbonByEmployee, updateUtangPiutang, replacePayrollItems } from "@/lib/services/finance.service";
import { calculatePayroll, buildManualItems, type PayrollItem } from "@/lib/services/payroll.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TPayrollHistoryInsert, TPayrollItemInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

const DEFAULT_PAYROLL_COA_KODE_AKUN = "5101";

function normalizePayrollMonth(value: string): string | null {
  const trimmed = value.trim();

  // Backward-compatible with legacy month input (YYYY-MM).
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  // New frontend input can send full date (YYYY-MM-DD).
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

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listPayroll(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data payroll.", 500, error.message);
  return ok({ payroll: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const employeeId = requireUUID(input, "employee_id");
  if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
  const bulan = requireString(input, "bulan", { maxLen: 20 });
  if (!bulan.ok) return fail(ErrorCode.VALIDATION_ERROR, bulan.message, 400);
  const normalizedBulan = bulan.data ? normalizePayrollMonth(bulan.data) : null;
  if (!normalizedBulan) {
    return fail(ErrorCode.VALIDATION_ERROR, "bulan harus berupa tanggal valid.", 400);
  }

  // Total dapat di-set eksplisit (backward-compatible legacy: dipakai sebagai
  // override gaji pokok saat payload tanpa items).
  const total = requireNumber(input, "total", { min: 0, optional: true });
  if (!total.ok) return fail(ErrorCode.VALIDATION_ERROR, total.message, 400);

  // Override nominal BPJS per payroll (opsional; kosong = otomatis dari tarif).
  const bpjsJht = requireNumber(input, "bpjs_jht", { min: 0, optional: true });
  if (!bpjsJht.ok) return fail(ErrorCode.VALIDATION_ERROR, bpjsJht.message, 400);
  const bpjsJp = requireNumber(input, "bpjs_jp", { min: 0, optional: true });
  if (!bpjsJp.ok) return fail(ErrorCode.VALIDATION_ERROR, bpjsJp.message, 400);

  // Komponen manual (FASE 1): TUNJANGAN / LEMBUR / BONUS / INSENTIF / POTONGAN_MANUAL
  const manualItems = buildManualItems(input.items);
  if (!manualItems.ok) return fail(ErrorCode.VALIDATION_ERROR, manualItems.message, 400);

  const coaId = requireUUID(input, "coa_id", { optional: true });
  if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaId.message, 400);

  // Cek duplikasi: employee_id + bulan sudah ada?
  const { data: existing } = await auth.ctx.supabase
    .schema("finance")
    .from("t_payroll_history")
    .select("employee_id")
    .eq("employee_id", employeeId.data!)
    .eq("bulan", normalizedBulan)
    .maybeSingle();
  if (existing) {
    return fail(ErrorCode.ALREADY_EXISTS, "Payroll untuk karyawan dan periode ini sudah ada.", 409);
  }

  // Ambil master karyawan (gaji pokok + tunjangan tetap)
  const { data: employee } = await auth.ctx.supabase.schema("hr").from("m_karyawan")
    .select("gaji_pokok, tunjangan_tetap")
    .eq("id", employeeId.data!)
    .single();

  const masterGajiPokok = Number(employee?.gaji_pokok ?? 0);
  // Backward-compatible: payload lama (tanpa items) yang mengirim `total` > 0
  // memperlakukan `total` sebagai gaji pokok (perilaku legacy).
  const gajiPokok =
    manualItems.items.length === 0 && Number(total.data ?? 0) > 0
      ? Number(total.data)
      : masterGajiPokok;

  // Kasbon aktif milik karyawan ini untuk potongan otomatis (lunas penuh)
  const { data: kasbonList } = await listKasbonByEmployee(auth.ctx.supabase, employeeId.data!);
  const kasbon = (kasbonList ?? []).map((k) => ({ id: k.id, nominal: Number(k.nominal) }));

  // Hitung payroll via engine
  const result = calculatePayroll({
    gajiPokok,
    tunjanganTetap: Number(employee?.tunjangan_tetap ?? 0),
    manualItems: manualItems.items,
    kasbonList: kasbon,
    bpjsOverride: {
      jht: bpjsJht.data ?? undefined,
      jp: bpjsJp.data ?? undefined,
    },
  });
  const summary = result.summary;

  // Resolve COA: jika tidak diinput, cari default dari m_coa
  let resolvedCoaId: string | null = coaId.data ?? null;
  if (!resolvedCoaId) {
    const { data: defaultCoa } = await auth.ctx.supabase
      .schema("finance")
      .from("m_coa")
      .select("id")
      .eq("kode_akun", DEFAULT_PAYROLL_COA_KODE_AKUN)
      .maybeSingle();
    if (defaultCoa) {
      resolvedCoaId = defaultCoa.id;
    }
  }

  const payload: TPayrollHistoryInsert = {
    employee_id: employeeId.data,
    bulan: normalizedBulan,
    total: summary.total,
    gaji_pokok: summary.gaji_pokok,
    potongan_kasbon: summary.potongan_kasbon,
    gaji_bersih: summary.gaji_bersih,
    coa_id: resolvedCoaId,
    status: "paid",
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

  const { data, error } = await createPayroll(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data payroll.", 500, error.message);

  // Simpan detail komponen ke t_payroll_item
  if (data) {
    const itemRows: TPayrollItemInsert[] = (result.items as PayrollItem[]).map((item) => ({
      employee_id: employeeId.data!,
      bulan: normalizedBulan,
      kode_komponen: item.kode_komponen,
      nama_komponen: item.nama_komponen,
      kategori: item.kategori,
      tipe: item.tipe,
      jumlah: item.jumlah,
      kasbon_id: item.kasbon_id ?? null,
      coa_id: item.coa_id ?? null,
    }));

    const { error: itemsError } = await replacePayrollItems(auth.ctx.supabase, employeeId.data!, normalizedBulan, itemRows);
    if (itemsError) {
      console.error("PAYROLL POST itemsError:", itemsError);
      // Rollback header agar tidak ada payroll tanpa detail komponen.
      await auth.ctx.supabase
        .schema("finance")
        .from("t_payroll_history")
        .delete()
        .eq("employee_id", employeeId.data!)
        .eq("bulan", normalizedBulan);
      return fail(ErrorCode.DB_ERROR, "Gagal menyimpan detail komponen payroll.", 500, itemsError.message);
    }

    // Jika ada potongan kasbon, tandai kasbon sebagai lunas
    if (summary.potongan_kasbon > 0 && kasbonList) {
      for (const kasbonRow of kasbonList) {
        await updateUtangPiutang(auth.ctx.supabase, kasbonRow.id, { kas: "kas tunai" });
      }
    }
  }

  return ok({ payroll: data }, "Data payroll berhasil dibuat.", 201);
}
