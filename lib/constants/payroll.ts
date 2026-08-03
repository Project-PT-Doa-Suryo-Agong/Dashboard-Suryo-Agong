/**
 * Konstanta Payroll — FASE 1
 *
 * Tarif BPJS Ketenagakerjaan (keputusan Fase 0):
 *   - JHT  (iuran karyawan)     : 2% dari gaji pokok
 *   - JP   (iuran karyawan)     : 1% dari gaji pokok
 *   - JKK  (iuran perusahaan)   : 0,24% dari gaji pokok (informasi)
 *   - JKM  (iuran perusahaan)   : 0,30% dari gaji pokok (informasi)
 *
 * Catatan: JKK & JKM tidak memengaruhi bruto/net karyawan — disimpan
 * pada kolom ringkas header bpjs_jkk_jkm untuk keperluan slip & jurnal
 * di fase lanjutan.
 */

export const PAYROLL_BPJS = {
  /** Jaminan Hari Tua — iuran karyawan, 2% dari gaji pokok */
  JHT_RATE: 0.02,
  /** Jaminan Pensiun — iuran karyawan, 1% dari gaji pokok */
  JP_RATE: 0.01,
  /** Jaminan Kecelakaan Kerja — iuran perusahaan, 0,24% dari gaji pokok */
  JKK_RATE: 0.0024,
  /** Jaminan Kematian — iuran perusahaan, 0,30% dari gaji pokok */
  JKM_RATE: 0.003,
} as const;

/** Kode komponen payroll yang dipakai pada finance.t_payroll_item. */
export const PAYROLL_COMPONENT = {
  GAJI_POKOK: "GAJI_POKOK",
  TUNJANGAN: "TUNJANGAN",
  LEMBUR: "LEMBUR",
  BONUS: "BONUS",
  INSENTIF: "INSENTIF",
  BPJS_JHT: "BPJS_JHT",
  BPJS_JP: "BPJS_JP",
  BPJS_JKK_JKM: "BPJS_JKK_JKM",
  KASBON: "KASBON",
  POTONGAN_MANUAL: "POTONGAN_MANUAL",
} as const;

export type PayrollComponentCode = (typeof PAYROLL_COMPONENT)[keyof typeof PAYROLL_COMPONENT];

/** Kategori komponen: pendapatan menambah bruto, potongan mengurangi net. */
export type PayrollItemCategory = "pendapatan" | "potongan";

/** Sumber nilai komponen: dihitung otomatis atau diinput manual. */
export type PayrollItemSource = "auto" | "manual";

/** Nama default komponen untuk slip/laporan. */
export const PAYROLL_COMPONENT_LABEL: Record<PayrollComponentCode, string> = {
  [PAYROLL_COMPONENT.GAJI_POKOK]: "Gaji Pokok",
  [PAYROLL_COMPONENT.TUNJANGAN]: "Tunjangan",
  [PAYROLL_COMPONENT.LEMBUR]: "Lembur",
  [PAYROLL_COMPONENT.BONUS]: "Bonus",
  [PAYROLL_COMPONENT.INSENTIF]: "Insentif",
  [PAYROLL_COMPONENT.BPJS_JHT]: "BPJS JHT",
  [PAYROLL_COMPONENT.BPJS_JP]: "BPJS JP",
  [PAYROLL_COMPONENT.BPJS_JKK_JKM]: "BPJS JKK & JKM (Perusahaan)",
  [PAYROLL_COMPONENT.KASBON]: "Potongan Kasbon",
  [PAYROLL_COMPONENT.POTONGAN_MANUAL]: "Potongan Manual",
};

/** Komponen yang boleh diinput manual per periode payroll. */
export const MANUAL_PAYROLL_COMPONENTS: ReadonlyArray<PayrollComponentCode> = [
  PAYROLL_COMPONENT.TUNJANGAN,
  PAYROLL_COMPONENT.LEMBUR,
  PAYROLL_COMPONENT.BONUS,
  PAYROLL_COMPONENT.INSENTIF,
  PAYROLL_COMPONENT.POTONGAN_MANUAL,
];

/** Kode akun COA pendukung payroll (lihat supabase/seed-payroll-coa.sql). */
export const PAYROLL_COA = {
  /** 2103 — Hutang BPJS (Liabilitas) */
  HUTANG_BPJS: "2103",
  /** 1202 — Piutang Karyawan (Aset, untuk kasbon) */
  PIUTANG_KARYAWAN: "1202",
} as const;
