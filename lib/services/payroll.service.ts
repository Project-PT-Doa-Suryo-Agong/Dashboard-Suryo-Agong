/**
 * Payroll Engine — FASE 1
 *
 * Mesin perhitungan payroll murni (pure functions, tanpa ketergantungan DB).
 * Rumus (keputusan Fase 0):
 *   bruto   = gaji_pokok + tunjangan + lembur + bonus + insentif
 *   potongan = BPJS JHT + BPJS JP + potongan kasbon + potongan manual
 *   net     = max(bruto - potongan, 0)   → disimpan pada kolom `total`
 *
 * BPJS JKK & JKM (iuran perusahaan) dihitung namun TIDAK memengaruhi
 * bruto/net — disimpan pada kolom ringkas bpjs_jkk_jkm di header.
 *
 * Komponen:
 *   - Auto   : Gaji Pokok (master), Tunjangan Tetap (master), BPJS, Kasbon
 *   - Manual : Tunjangan, Lembur, Bonus, Insentif, Potongan Manual
 */

import {
  MANUAL_PAYROLL_COMPONENTS,
  PAYROLL_BPJS,
  PAYROLL_COMPONENT,
  PAYROLL_COMPONENT_LABEL,
  type PayrollComponentCode,
  type PayrollItemCategory,
  type PayrollItemSource,
} from "@/lib/constants/payroll";

/** Item komponen payroll siap simpan ke finance.t_payroll_item. */
export interface PayrollItem {
  employee_id: string;
  bulan: string;
  kode_komponen: PayrollComponentCode;
  nama_komponen: string;
  kategori: PayrollItemCategory;
  tipe: PayrollItemSource;
  jumlah: number;
  kasbon_id?: string | null;
  coa_id?: string | null;
}

/** Item manual yang diterima dari API (TUNJANGAN/LEMBUR/BONUS/INSENTIF/POTONGAN_MANUAL). */
export interface PayrollManualItemInput {
  kode_komponen: PayrollComponentCode;
  jumlah: number;
  nama_komponen?: string;
}

/** Kasbon aktif milik karyawan (belum lunas). */
export interface PayrollKasbonInput {
  id: string;
  nominal: number;
}

/** Input perhitungan payroll. */
export interface PayrollCalculationInput {
  /** Gaji pokok karyawan (master m_karyawan.gaji_pokok atau override legacy `total`). */
  gajiPokok: number;
  /** Tunjangan tetap bulanan (master m_karyawan.tunjangan_tetap). */
  tunjanganTetap?: number;
  /** Komponen manual yang diinput per periode. */
  manualItems?: PayrollManualItemInput[];
  /** Kasbon aktif (belum lunas). Potongan lunas penuh per payroll. */
  kasbonList?: PayrollKasbonInput[];
  /** Override nominal BPJS per payroll (undefined = otomatis dari tarif). */
  bpjsOverride?: {
    jht?: number;
    jp?: number;
  };
}

/** Ringkasan hasil perhitungan payroll (kolom ringkas header). */
export interface PayrollSummary {
  gaji_pokok: number;
  tunjangan: number;
  lembur: number;
  bonus: number;
  insentif: number;
  potongan_manual: number;
  bpjs_jht: number;
  bpjs_jp: number;
  bpjs_jkk_jkm: number;
  potongan_kasbon: number;
  gaji_kotor: number;
  gaji_bersih: number;
  /** Alias gaji_bersih — kolom `total` di t_payroll_history. */
  total: number;
}

export interface PayrollCalculationResult {
  summary: PayrollSummary;
  items: PayrollItem[];
}

/** Pembulatan nilai komponen ke rupiah penuh (floor, sesuai keputusan Fase 0). */
export function roundRupiah(value: number): number {
  return Math.max(0, Math.floor(value));
}

const MANUAL_CATEGORY: Record<PayrollComponentCode, PayrollItemCategory> = {
  [PAYROLL_COMPONENT.GAJI_POKOK]: "pendapatan",
  [PAYROLL_COMPONENT.TUNJANGAN]: "pendapatan",
  [PAYROLL_COMPONENT.LEMBUR]: "pendapatan",
  [PAYROLL_COMPONENT.BONUS]: "pendapatan",
  [PAYROLL_COMPONENT.INSENTIF]: "pendapatan",
  [PAYROLL_COMPONENT.BPJS_JHT]: "potongan",
  [PAYROLL_COMPONENT.BPJS_JP]: "potongan",
  [PAYROLL_COMPONENT.BPJS_JKK_JKM]: "pendapatan",
  [PAYROLL_COMPONENT.KASBON]: "potongan",
  [PAYROLL_COMPONENT.POTONGAN_MANUAL]: "potongan",
};

/**
 * Hitung payroll lengkap (komponen auto + manual) untuk satu karyawan
 * pada satu periode. Mengembalikan ringkasan header + item detail.
 */
export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const gajiPokok = roundRupiah(input.gajiPokok);
  const tunjanganTetap = roundRupiah(input.tunjanganTetap ?? 0);
  const manualItems = input.manualItems ?? [];
  const kasbonList = input.kasbonList ?? [];

  // ── Kelompokkan komponen manual ──
  let tunjanganManual = 0;
  let lembur = 0;
  let bonus = 0;
  let insentif = 0;
  let potonganManual = 0;
  const manualItemRows: PayrollItem[] = [];

  for (const item of manualItems) {
    const jumlah = roundRupiah(item.jumlah);
    if (jumlah <= 0) continue;
    const kode = item.kode_komponen;
    manualItemRows.push({
      employee_id: "",
      bulan: "",
      kode_komponen: kode,
      nama_komponen: item.nama_komponen?.trim() || PAYROLL_COMPONENT_LABEL[kode],
      kategori: MANUAL_CATEGORY[kode],
      tipe: "manual",
      jumlah,
    });
    switch (kode) {
      case PAYROLL_COMPONENT.TUNJANGAN:
        tunjanganManual += jumlah;
        break;
      case PAYROLL_COMPONENT.LEMBUR:
        lembur += jumlah;
        break;
      case PAYROLL_COMPONENT.BONUS:
        bonus += jumlah;
        break;
      case PAYROLL_COMPONENT.INSENTIF:
        insentif += jumlah;
        break;
      case PAYROLL_COMPONENT.POTONGAN_MANUAL:
        potonganManual += jumlah;
        break;
      default:
        break;
    }
  }

  // ── BPJS (dari gaji pokok, atau override manual per payroll) ──
  const bpjsJht = roundRupiah(input.bpjsOverride?.jht ?? gajiPokok * PAYROLL_BPJS.JHT_RATE);
  const bpjsJp = roundRupiah(input.bpjsOverride?.jp ?? gajiPokok * PAYROLL_BPJS.JP_RATE);
  const bpjsJkkJkm = roundRupiah(gajiPokok * (PAYROLL_BPJS.JKK_RATE + PAYROLL_BPJS.JKM_RATE));

  // ── Bruto ──
  const tunjangan = tunjanganTetap + tunjanganManual;
  const gajiKotor = gajiPokok + tunjangan + lembur + bonus + insentif;

  // ── Potongan kasbon (lunas penuh, tidak boleh melebihi sisa bruto) ──
  const kasbonTotal = kasbonList.reduce((sum, k) => sum + roundRupiah(k.nominal), 0);
  const sisaSetelahPotonganLain = Math.max(gajiKotor - bpjsJht - bpjsJp - potonganManual, 0);
  const potonganKasbon = Math.min(kasbonTotal, sisaSetelahPotonganLain);

  // ── Net ──
  const totalPotongan = bpjsJht + bpjsJp + potonganManual + potonganKasbon;
  const gajiBersih = Math.max(gajiKotor - totalPotongan, 0);

  // ── Item auto (pendapatan) ──
  const autoItems: PayrollItem[] = [];
  if (gajiPokok > 0) {
    autoItems.push({
      employee_id: "",
      bulan: "",
      kode_komponen: PAYROLL_COMPONENT.GAJI_POKOK,
      nama_komponen: PAYROLL_COMPONENT_LABEL[PAYROLL_COMPONENT.GAJI_POKOK],
      kategori: "pendapatan",
      tipe: "auto",
      jumlah: gajiPokok,
    });
  }
  if (tunjanganTetap > 0) {
    autoItems.push({
      employee_id: "",
      bulan: "",
      kode_komponen: PAYROLL_COMPONENT.TUNJANGAN,
      nama_komponen: "Tunjangan Tetap",
      kategori: "pendapatan",
      tipe: "auto",
      jumlah: tunjanganTetap,
    });
  }

  // ── Item potongan BPJS (auto) ──
  if (bpjsJht > 0) {
    autoItems.push({
      employee_id: "",
      bulan: "",
      kode_komponen: PAYROLL_COMPONENT.BPJS_JHT,
      nama_komponen: PAYROLL_COMPONENT_LABEL[PAYROLL_COMPONENT.BPJS_JHT],
      kategori: "potongan",
      tipe: "auto",
      jumlah: bpjsJht,
    });
  }
  if (bpjsJp > 0) {
    autoItems.push({
      employee_id: "",
      bulan: "",
      kode_komponen: PAYROLL_COMPONENT.BPJS_JP,
      nama_komponen: PAYROLL_COMPONENT_LABEL[PAYROLL_COMPONENT.BPJS_JP],
      kategori: "potongan",
      tipe: "auto",
      jumlah: bpjsJp,
    });
  }

  // ── Item kasbon (auto, per kasbon) ──
  const kasbonItems: PayrollItem[] = [];
  let sisaKasbon = potonganKasbon;
  for (const kasbon of kasbonList) {
    if (sisaKasbon <= 0) break;
    const jumlah = Math.min(roundRupiah(kasbon.nominal), sisaKasbon);
    if (jumlah <= 0) continue;
    kasbonItems.push({
      employee_id: "",
      bulan: "",
      kode_komponen: PAYROLL_COMPONENT.KASBON,
      nama_komponen: PAYROLL_COMPONENT_LABEL[PAYROLL_COMPONENT.KASBON],
      kategori: "potongan",
      tipe: "auto",
      jumlah,
      kasbon_id: kasbon.id,
    });
    sisaKasbon -= jumlah;
  }

  const summary: PayrollSummary = {
    gaji_pokok: gajiPokok,
    tunjangan,
    lembur,
    bonus,
    insentif,
    potongan_manual: potonganManual,
    bpjs_jht: bpjsJht,
    bpjs_jp: bpjsJp,
    bpjs_jkk_jkm: bpjsJkkJkm,
    potongan_kasbon: potonganKasbon,
    gaji_kotor: gajiKotor,
    gaji_bersih: gajiBersih,
    total: gajiBersih,
  };

  return {
    summary,
    items: [...autoItems, ...manualItemRows, ...kasbonItems],
  };
}

/**
 * Bangun daftar komponen manual dari payload items API.
 * Validasi: kode komponen harus termasuk komponen manual & jumlah >= 0.
 * Mengembalikan error message bila tidak valid (null jika valid).
 */
export function buildManualItems(
  rawItems: unknown,
): { ok: true; items: PayrollManualItemInput[] } | { ok: false; message: string } {
  if (rawItems === undefined || rawItems === null) return { ok: true, items: [] };
  if (!Array.isArray(rawItems)) {
    return { ok: false, message: "items harus berupa array." };
  }

  const items: PayrollManualItemInput[] = [];
  for (const [index, raw] of rawItems.entries()) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, message: `items[${index}] harus berupa objek.` };
    }
    const entry = raw as Record<string, unknown>;
    const kode = entry.kode_komponen;
    if (typeof kode !== "string" || !MANUAL_PAYROLL_COMPONENTS.includes(kode as PayrollComponentCode)) {
      return {
        ok: false,
        message: `items[${index}].kode_komponen tidak valid (harus salah satu dari: ${MANUAL_PAYROLL_COMPONENTS.join(", ")}).`,
      };
    }
    const jumlah = Number(entry.jumlah);
    if (Number.isNaN(jumlah) || jumlah < 0) {
      return { ok: false, message: `items[${index}].jumlah harus berupa angka >= 0.` };
    }
    const nama = typeof entry.nama_komponen === "string" ? entry.nama_komponen.trim() : "";
    items.push({
      kode_komponen: kode as PayrollComponentCode,
      jumlah,
      nama_komponen: nama || undefined,
    });
  }
  return { ok: true, items };
}
