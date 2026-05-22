import { requireLevel } from "@/lib/guards/auth.guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

/**
 * GET /api/sales/orders/template
 * Returns an .xlsx file with:
 *   - Header row containing the column names (including no_order for multi-variant)
 *   - A reference sheet "Daftar Varian" listing all available variants (SKU + Nama + Harga)
 *   - Example rows showing both single and multi-variant orders
 *   - A guide sheet explaining each column
 */

export async function GET() {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  // Fetch all variants for reference
  const { data: variants } = await supabaseAdmin
    .schema("core" as any)
    .from("m_varian")
    .select("id, nama_varian, sku, harga")
    .order("nama_varian", { ascending: true });

  // Create workbook
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Template Import ───────────────────────────────────────────
  const templateHeaders = [
    "no_order",
    "nama_varian",
    "sku",
    "quantity",
    "nama_pelanggan",
    "nomor_telepon",
    "lokasi",
    "diskon",
    "terms_of_payment",
  ];

  const v1 = variants?.[0];
  const v2 = variants?.[1] ?? variants?.[0];

  // Example rows showing multi-variant capability
  const exampleRows = [
    {
      no_order: 1,
      nama_varian: v1?.nama_varian ?? "Contoh Produk A",
      sku: v1?.sku ?? "SKU-001",
      quantity: 5,
      nama_pelanggan: "Budi Santoso",
      nomor_telepon: "08123456789",
      lokasi: "Jakarta",
      diskon: 0,
      terms_of_payment: 0,
    },
    {
      no_order: 1,
      nama_varian: v2?.nama_varian ?? "Contoh Produk B",
      sku: v2?.sku ?? "SKU-002",
      quantity: 3,
      nama_pelanggan: "",
      nomor_telepon: "",
      lokasi: "",
      diskon: "",
      terms_of_payment: "",
    },
    {
      no_order: 2,
      nama_varian: v1?.nama_varian ?? "Contoh Produk A",
      sku: v1?.sku ?? "SKU-001",
      quantity: 2,
      nama_pelanggan: "Siti Aminah",
      nomor_telepon: "08234567890",
      lokasi: "Surabaya",
      diskon: 10000,
      terms_of_payment: 30,
    },
  ];

  const ws1 = XLSX.utils.json_to_sheet(exampleRows, { header: templateHeaders });

  // Set column widths for better readability
  ws1["!cols"] = [
    { wch: 12 },  // no_order
    { wch: 30 },  // nama_varian
    { wch: 18 },  // sku
    { wch: 10 },  // quantity
    { wch: 25 },  // nama_pelanggan
    { wch: 18 },  // nomor_telepon
    { wch: 20 },  // lokasi
    { wch: 12 },  // diskon
    { wch: 20 },  // terms_of_payment
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Template Import");

  // ── Sheet 2: Daftar Varian (Reference) ─────────────────────────────────
  const variantRefData = (variants ?? []).map((v: any) => ({
    "Nama Varian": v.nama_varian ?? "-",
    "SKU": v.sku ?? "-",
    "Harga (IDR)": v.harga ?? 0,
  }));

  if (variantRefData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(variantRefData);
    ws2["!cols"] = [
      { wch: 35 },  // Nama Varian
      { wch: 20 },  // SKU
      { wch: 15 },  // Harga
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Daftar Varian");
  }

  // ── Sheet 3: Panduan ───────────────────────────────────────────────────
  const guideData = [
    { Kolom: "no_order", Deskripsi: "Nomor grup order. Baris dengan no_order sama = 1 order (multi-varian). Kosongkan jika 1 baris = 1 order.", Wajib: "Tidak (opsional)", Contoh: "1" },
    { Kolom: "nama_varian", Deskripsi: "Nama varian produk (sesuai Daftar Varian)", Wajib: "Ya (atau isi SKU)", Contoh: v1?.nama_varian ?? "Contoh Produk" },
    { Kolom: "sku", Deskripsi: "SKU produk (sesuai Daftar Varian)", Wajib: "Ya (atau isi nama_varian)", Contoh: v1?.sku ?? "SKU-001" },
    { Kolom: "quantity", Deskripsi: "Jumlah barang yang dipesan", Wajib: "Ya", Contoh: "5" },
    { Kolom: "nama_pelanggan", Deskripsi: "Nama pelanggan (diambil dari baris pertama tiap grup)", Wajib: "Tidak", Contoh: "Budi Santoso" },
    { Kolom: "nomor_telepon", Deskripsi: "Nomor telepon pelanggan (diambil dari baris pertama tiap grup)", Wajib: "Tidak", Contoh: "08123456789" },
    { Kolom: "lokasi", Deskripsi: "Lokasi pengiriman (diambil dari baris pertama tiap grup)", Wajib: "Tidak", Contoh: "Jakarta" },
    { Kolom: "diskon", Deskripsi: "Potongan harga dalam rupiah (diambil dari baris pertama tiap grup)", Wajib: "Tidak (default: 0)", Contoh: "0" },
    { Kolom: "terms_of_payment", Deskripsi: "Jatuh tempo pembayaran dalam hari, 0 = cash (diambil dari baris pertama tiap grup)", Wajib: "Tidak (default: 0)", Contoh: "0" },
    { Kolom: "", Deskripsi: "", Wajib: "", Contoh: "" },
    { Kolom: "CATATAN", Deskripsi: "Baris dengan no_order SAMA akan digabung jadi 1 order dengan banyak varian.", Wajib: "", Contoh: "" },
    { Kolom: "", Deskripsi: "Contoh: no_order=1 baris 1 & baris 2 → 1 order dengan 2 varian.", Wajib: "", Contoh: "" },
    { Kolom: "", Deskripsi: "Data pelanggan (nama, telepon, lokasi, diskon, TOP) diambil dari baris PERTAMA setiap grup.", Wajib: "", Contoh: "" },
    { Kolom: "", Deskripsi: "Jika no_order dikosongkan, setiap baris menjadi 1 order terpisah.", Wajib: "", Contoh: "" },
  ];

  const ws3 = XLSX.utils.json_to_sheet(guideData);
  ws3["!cols"] = [
    { wch: 22 },
    { wch: 70 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Panduan");

  // Generate buffer
  const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=template_sales_order.xlsx",
    },
  });
}
