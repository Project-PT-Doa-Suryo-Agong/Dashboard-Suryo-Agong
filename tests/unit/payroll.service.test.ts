import { describe, expect, it } from "vitest";
import {
  calculatePayroll,
  roundRupiah,
  buildManualItems,
  type PayrollCalculationInput,
} from "@/lib/services/payroll.service";
import { PAYROLL_COMPONENT } from "@/lib/constants/payroll";

function run(input: PayrollCalculationInput) {
  return calculatePayroll(input);
}

describe("roundRupiah", () => {
  it("membulatkan ke bawah (floor) ke rupiah penuh", () => {
    expect(roundRupiah(24999.9)).toBe(24999);
    expect(roundRupiah(0.4)).toBe(0);
  });

  it("tidak pernah menghasilkan negatif", () => {
    expect(roundRupiah(-100)).toBe(0);
  });
});

describe("calculatePayroll — komponen dasar", () => {
  it("menghitung gaji pokok dengan potongan BPJS (tanpa kasbon/komponen manual)", () => {
    const { summary, items } = run({ gajiPokok: 2_500_000 });

    expect(summary.gaji_pokok).toBe(2_500_000);
    expect(summary.tunjangan).toBe(0);
    expect(summary.lembur).toBe(0);
    expect(summary.bonus).toBe(0);
    expect(summary.insentif).toBe(0);
    expect(summary.potongan_manual).toBe(0);
    expect(summary.gaji_kotor).toBe(2_500_000);
    // net = bruto − (JHT 50.000 + JP 25.000) = 2.425.000
    expect(summary.gaji_bersih).toBe(2_425_000);
    expect(summary.total).toBe(2_425_000);

    // Item: hanya Gaji Pokok (auto, pendapatan)
    const gajiPokokItems = items.filter((i) => i.kode_komponen === PAYROLL_COMPONENT.GAJI_POKOK);
    expect(gajiPokokItems).toHaveLength(1);
    expect(gajiPokokItems[0]).toMatchObject({ kategori: "pendapatan", tipe: "auto", jumlah: 2_500_000 });
  });

  it("menghitung BPJS JHT 2%, JP 1%, dan JKK+JKM 0,54% dari gaji pokok", () => {
    const { summary, items } = run({ gajiPokok: 2_500_000 });

    expect(summary.bpjs_jht).toBe(50_000); // 2.500.000 × 0,02
    expect(summary.bpjs_jp).toBe(25_000); // 2.500.000 × 0,01
    expect(summary.bpjs_jkk_jkm).toBe(13_500); // 2.500.000 × 0,0054

    // JHT & JP adalah potongan karyawan → net berkurang
    expect(summary.gaji_bersih).toBe(2_500_000 - 50_000 - 25_000);

    const jhtItems = items.filter((i) => i.kode_komponen === PAYROLL_COMPONENT.BPJS_JHT);
    const jpItems = items.filter((i) => i.kode_komponen === PAYROLL_COMPONENT.BPJS_JP);
    expect(jhtItems).toHaveLength(1);
    expect(jhtItems[0]).toMatchObject({ kategori: "potongan", tipe: "auto", jumlah: 50_000 });
    expect(jpItems).toHaveLength(1);
    expect(jpItems[0]).toMatchObject({ kategori: "potongan", tipe: "auto", jumlah: 25_000 });

    // JKK+JKM disimpan di ringkasan, tidak memengaruhi bruto/net
    expect(summary.gaji_kotor).toBe(2_500_000);
  });
});

describe("calculatePayroll — komponen manual", () => {
  it("menjumlahkan tunjangan tetap (master) + tunjangan manual", () => {
    const { summary } = run({
      gajiPokok: 2_000_000,
      tunjanganTetap: 200_000,
      manualItems: [{ kode_komponen: PAYROLL_COMPONENT.TUNJANGAN, jumlah: 100_000 }],
    });
    expect(summary.tunjangan).toBe(300_000);
    expect(summary.gaji_kotor).toBe(2_300_000);
  });

  it("menghitung lembur, bonus, insentif, potongan manual", () => {
    const { summary, items } = run({
      gajiPokok: 2_000_000,
      manualItems: [
        { kode_komponen: PAYROLL_COMPONENT.LEMBUR, jumlah: 150_000 },
        { kode_komponen: PAYROLL_COMPONENT.BONUS, jumlah: 250_000 },
        { kode_komponen: PAYROLL_COMPONENT.INSENTIF, jumlah: 100_000 },
        { kode_komponen: PAYROLL_COMPONENT.POTONGAN_MANUAL, jumlah: 50_000 },
      ],
    });

    expect(summary.lembur).toBe(150_000);
    expect(summary.bonus).toBe(250_000);
    expect(summary.insentif).toBe(100_000);
    expect(summary.potongan_manual).toBe(50_000);

    // bruto = 2.000.000 + 150.000 + 250.000 + 100.000 = 2.500.000
    expect(summary.gaji_kotor).toBe(2_500_000);
    // net = 2.500.000 − (JHT 40.000 + JP 20.000 + potongan manual 50.000) = 2.390.000
    expect(summary.gaji_bersih).toBe(2_390_000);

    const manualItems = items.filter((i) => i.tipe === "manual");
    expect(manualItems).toHaveLength(4);
    expect(manualItems.every((i) => i.employee_id === "" && i.bulan === "")).toBe(true);
  });

  it("mengabaikan item manual dengan jumlah 0 atau negatif", () => {
    const { summary, items } = run({
      gajiPokok: 1_000_000,
      manualItems: [
        { kode_komponen: PAYROLL_COMPONENT.BONUS, jumlah: 0 },
        { kode_komponen: PAYROLL_COMPONENT.BONUS, jumlah: -500 },
      ],
    });
    expect(summary.bonus).toBe(0);
    expect(items.filter((i) => i.kode_komponen === PAYROLL_COMPONENT.BONUS)).toHaveLength(0);
  });

  it("menggunakan nama_komponen kustom bila diberikan", () => {
    const { items } = run({
      gajiPokok: 1_000_000,
      manualItems: [{ kode_komponen: PAYROLL_COMPONENT.BONUS, jumlah: 100_000, nama_komponen: "Bonus THR" }],
    });
    const bonus = items.find((i) => i.kode_komponen === PAYROLL_COMPONENT.BONUS);
    expect(bonus?.nama_komponen).toBe("Bonus THR");
  });
});

describe("calculatePayroll — override BPJS per payroll", () => {
  it("memakai nominal override JHT/JP alih-alih tarif otomatis", () => {
    const { summary, items } = run({
      gajiPokok: 2_500_000,
      bpjsOverride: { jht: 100_000, jp: 50_000 },
    });

    expect(summary.bpjs_jht).toBe(100_000);
    expect(summary.bpjs_jp).toBe(50_000);
    // net = 2.500.000 − (100.000 + 50.000) = 2.350.000
    expect(summary.gaji_bersih).toBe(2_350_000);

    const jhtItem = items.find((i) => i.kode_komponen === PAYROLL_COMPONENT.BPJS_JHT);
    expect(jhtItem?.jumlah).toBe(100_000);
  });

  it("override 0 menonaktifkan potongan BPJS", () => {
    const { summary } = run({
      gajiPokok: 2_500_000,
      bpjsOverride: { jht: 0, jp: 0 },
    });

    expect(summary.bpjs_jht).toBe(0);
    expect(summary.bpjs_jp).toBe(0);
    expect(summary.gaji_bersih).toBe(2_500_000);
  });

  it("override sebagian: hanya JP di-override, JHT tetap otomatis", () => {
    const { summary } = run({
      gajiPokok: 2_500_000,
      bpjsOverride: { jp: 25_000 },
    });

    expect(summary.bpjs_jht).toBe(50_000); // 2.500.000 × 2% (auto)
    expect(summary.bpjs_jp).toBe(25_000);
    // JKK+JKM tetap dari tarif (info, tidak memengaruhi net)
    expect(summary.bpjs_jkk_jkm).toBe(13_500);
  });

  it("tanpa override tetap pakai tarif otomatis (tidak berubah)", () => {
    const { summary } = run({ gajiPokok: 2_500_000 });
    expect(summary.bpjs_jht).toBe(50_000);
    expect(summary.bpjs_jp).toBe(25_000);
  });
});

describe("calculatePayroll — kasbon", () => {
  it("memotong seluruh kasbon aktif (lunas penuh)", () => {
    const { summary, items } = run({
      gajiPokok: 2_000_000,
      kasbonList: [
        { id: "kasbon-a", nominal: 300_000 },
        { id: "kasbon-b", nominal: 200_000 },
      ],
    });

    expect(summary.potongan_kasbon).toBe(500_000);
    // net = 2.000.000 − (JHT 40.000 + JP 20.000 + kasbon 500.000) = 1.440.000
    expect(summary.gaji_bersih).toBe(1_440_000);

    const kasbonItems = items.filter((i) => i.kode_komponen === PAYROLL_COMPONENT.KASBON);
    expect(kasbonItems).toHaveLength(2);
    expect(kasbonItems.map((i) => i.kasbon_id).sort()).toEqual(["kasbon-a", "kasbon-b"]);
  });

  it("membatasi potongan kasbon agar tidak melebihi sisa bruto (net tidak negatif)", () => {
    const { summary, items } = run({
      gajiPokok: 1_000_000,
      kasbonList: [
        { id: "kasbon-besar", nominal: 1_500_000 },
        { id: "kasbon-kecil", nominal: 500_000 },
      ],
    });

    // sisa setelah BPJS (20.000 + 10.000) = 970.000
    expect(summary.potongan_kasbon).toBe(970_000);
    expect(summary.gaji_bersih).toBe(0);

    const kasbonItems = items.filter((i) => i.kode_komponen === PAYROLL_COMPONENT.KASBON);
    expect(kasbonItems).toHaveLength(1);
    expect(kasbonItems[0]).toMatchObject({ kasbon_id: "kasbon-besar", jumlah: 970_000 });
  });

  it("menggabungkan kasbon dengan potongan manual (kapasitas potong habis lebih dulu)", () => {
    const { summary } = run({
      gajiPokok: 1_000_000,
      kasbonList: [{ id: "k1", nominal: 500_000 }],
      manualItems: [{ kode_komponen: PAYROLL_COMPONENT.POTONGAN_MANUAL, jumlah: 300_000 }],
    });

    // sisa = 1.000.000 − JHT 20.000 − JP 10.000 − manual 300.000 = 670.000
    expect(summary.potongan_kasbon).toBe(500_000);
    expect(summary.potongan_manual).toBe(300_000);
    expect(summary.gaji_bersih).toBe(1_000_000 - 20_000 - 10_000 - 300_000 - 500_000);
  });
});

describe("calculatePayroll — integritas angka", () => {
  it("net selalu bruto dikurangi total potongan", () => {
    const { summary } = run({
      gajiPokok: 1_800_000,
      tunjanganTetap: 150_000,
      kasbonList: [{ id: "k1", nominal: 250_000 }],
      manualItems: [
        { kode_komponen: PAYROLL_COMPONENT.LEMBUR, jumlah: 100_000 },
        { kode_komponen: PAYROLL_COMPONENT.POTONGAN_MANUAL, jumlah: 25_000 },
      ],
    });

    const totalPotongan = summary.bpjs_jht + summary.bpjs_jp + summary.potongan_manual + summary.potongan_kasbon;
    expect(summary.gaji_kotor - totalPotongan).toBe(summary.gaji_bersih);
    expect(summary.total).toBe(summary.gaji_bersih);
  });
});

describe("buildManualItems — validasi payload API", () => {
  it("menerima items kosong / undefined", () => {
    expect(buildManualItems(undefined)).toEqual({ ok: true, items: [] });
    expect(buildManualItems([])).toEqual({ ok: true, items: [] });
  });

  it("menolak items yang bukan array", () => {
    expect(buildManualItems({ a: 1 }).ok).toBe(false);
  });

  it("menolak kode komponen yang tidak termasuk manual", () => {
    const result = buildManualItems([{ kode_komponen: PAYROLL_COMPONENT.GAJI_POKOK, jumlah: 100 }]);
    expect(result.ok).toBe(false);
  });

  it("menolak jumlah negatif", () => {
    const result = buildManualItems([{ kode_komponen: PAYROLL_COMPONENT.BONUS, jumlah: -1 }]);
    expect(result.ok).toBe(false);
  });

  it("menerima komponen manual yang valid", () => {
    const result = buildManualItems([
      { kode_komponen: PAYROLL_COMPONENT.LEMBUR, jumlah: 100_000 },
      { kode_komponen: PAYROLL_COMPONENT.POTONGAN_MANUAL, jumlah: 25_000, nama_komponen: "Denda" },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(2);
      expect(result.items[1].nama_komponen).toBe("Denda");
    }
  });
});
