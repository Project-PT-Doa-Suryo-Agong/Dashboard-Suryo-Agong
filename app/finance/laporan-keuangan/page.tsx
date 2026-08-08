"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Download,
  Printer,
  Calendar,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { apiFetch } from "@/lib/utils/api-fetch";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { SearchBar } from "@/components/ui/search-bar";
import {
  CashflowLineChart,
  type CashflowPoint,
} from "@/components/ui/DashboardCharts";
import type { ApiError, ApiSuccess } from "@/types/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type AccessLevel = "strategic" | "managerial" | "operational" | "support";

type TabDef = {
  id: string;
  label: string;
  icon: string;
  minLevel: AccessLevel;
};

const TABS: TabDef[] = [
  { id: "ringkasan", label: "Ringkasan", icon: "BarChart3", minLevel: "strategic" },
  { id: "laba-rugi", label: "Laba Rugi", icon: "TrendingUp", minLevel: "strategic" },
  { id: "neraca", label: "Neraca", icon: "Landmark", minLevel: "strategic" },
  { id: "arus-kas", label: "Arus Kas", icon: "Wallet", minLevel: "operational" },
  { id: "buku-besar", label: "Buku Besar", icon: "FileText", minLevel: "operational" },
  { id: "jurnal-umum", label: "Jurnal Umum", icon: "FileSpreadsheet", minLevel: "operational" },
];

const PERIODE_OPTIONS = [
  { value: "hariIni", label: "Hari Ini" },
  { value: "mingguIni", label: "Minggu Ini" },
  { value: "bulanIni", label: "Bulan Ini" },
  { value: "kuartalIni", label: "Kuartal Ini" },
  { value: "tahunIni", label: "Tahun Ini" },
  { value: "custom", label: "Custom" },
] as const;

const LEVEL_ORDER: Record<AccessLevel, number> = {
  strategic: 4,
  managerial: 3,
  operational: 2,
  support: 1,
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Terjadi kesalahan." : payload.error.message);
  }
  return payload;
}

/** Ambil SELURUH halaman dari satu endpoint report (khusus export).
 *  Tidak mengubah API; hanya me-loop page hingga seluruh data terkumpul. */
async function fetchAllPages<T>(
  basePath: string,
  query: Record<string, string>,
  extract: (data: any) => T[]
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  for (;;) {
    const params = new URLSearchParams(query);
    params.set("page", String(page));
    params.set("limit", "100");
    const res = await apiFetch(`${basePath}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await parseJsonResponse<any>(res);
    const rows = extract(payload.data) ?? [];
    all.push(...rows);
    const total = Number(payload.data?.meta?.total ?? 0);
    if (rows.length === 0 || page * 100 >= total) break;
    page += 1;
  }
  return all;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateLong(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatPeriodLabel(periode: string): string {
  const opt = PERIODE_OPTIONS.find((p) => p.value === periode);
  return opt ? opt.label : "Kustom";
}

function getDateRange(periode: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  const pad = (n: number) => String(n).padStart(2, "0");
  const toDateStr = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

  switch (periode) {
    case "hariIni": {
      const start = new Date(y, m, d);
      return { start_date: toDateStr(start), end_date: toDateStr(start) };
    }
    case "mingguIni": {
      const dayOfWeek = now.getDay();
      const mon = new Date(y, m, d - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { start_date: toDateStr(mon), end_date: toDateStr(sun) };
    }
    case "bulanIni":
      return {
        start_date: toDateStr(new Date(y, m, 1)),
        end_date: toDateStr(new Date(y, m + 1, 0)),
      };
    case "kuartalIni": {
      const q = Math.floor(m / 3) * 3;
      return {
        start_date: toDateStr(new Date(y, q, 1)),
        end_date: toDateStr(new Date(y, q + 3, 0)),
      };
    }
    case "tahunIni":
      return {
        start_date: toDateStr(new Date(y, 0, 1)),
        end_date: toDateStr(new Date(y, 11, 31)),
      };
    case "custom":
      return {
        start_date: customStart || toDateStr(new Date(y, m, 1)),
        end_date: customEnd || toDateStr(new Date(y, m + 1, 0)),
      };
    default:
      return {
        start_date: toDateStr(new Date(y, m, 1)),
        end_date: toDateStr(new Date(y, m + 1, 0)),
      };
  }
}

function exportFileName(report: string, startDate: string, endDate: string, ext: string): string {
  const map: Record<string, string> = {
    ringkasan: "Ringkasan_Keuangan",
    "laba-rugi": "Laporan_Laba_Rugi",
    neraca: "Neraca",
    "arus-kas": "Arus_Kas",
    "buku-besar": "Buku_Besar",
    "jurnal-umum": "Jurnal_Umum",
  };
  const prefix = map[report] || report;
  const period = startDate === endDate ? startDate : `${startDate}_${endDate}`;
  return `${prefix}_${period}.${ext}`;
}

export default function LaporanKeuanganPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const userLevel: AccessLevel = user?.accessLevel ?? "operational";
  const userLevelNum = LEVEL_ORDER[userLevel] ?? 0;

  const allowedTabs = useMemo(
    () => TABS.filter((t) => LEVEL_ORDER[t.minLevel] <= userLevelNum),
    [userLevelNum],
  );

  const defaultTab = allowedTabs.length > 0 ? allowedTabs[0].id : "arus-kas";

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || defaultTab);
  const [periode, setPeriode] = useState(searchParams.get("periode") || "bulanIni");
  const [customStart, setCustomStart] = useState(searchParams.get("start_date") || "");
  const [customEnd, setCustomEnd] = useState(searchParams.get("end_date") || "");
  const [coaFilter, setCoaFilter] = useState(searchParams.get("coa_id") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  // Laba Rugi data
  const [labaRugiData, setLabaRugiData] = useState<any>(null);
  // Neraca data
  const [neracaData, setNeracaData] = useState<any>(null);
  // Arus Kas data
  const [arusKasData, setArusKasData] = useState<any>(null);
  // Buku Besar data
  const [bukuBesarData, setBukuBesarData] = useState<any>(null);
  // Jurnal Umum data
  const [jurnalData, setJurnalData] = useState<any>(null);
  // COA list for filter dropdown
  const [coaList, setCoaList] = useState<any[]>([]);

  const dateRange = useMemo(
    () => getDateRange(periode, customStart, customEnd),
    [periode, customStart, customEnd],
  );

  const setSearchParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParam("tab", tabId);
    setPage(1);
    setSearchParam("page", "");
  };

  const handlePeriodeChange = (val: string) => {
    setPeriode(val);
    setSearchParam("periode", val);
    if (val !== "custom") {
      setCustomStart("");
      setCustomEnd("");
      setSearchParam("start_date", "");
      setSearchParam("end_date", "");
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { start_date, end_date } = dateRange;

    try {
      const promises: Promise<any>[] = [];

      if (activeTab === "ringkasan") {
        promises.push(
          parseJsonResponse<any>(
            await apiFetch(`/api/finance/reports/dashboard?start_date=${start_date}&end_date=${end_date}`, {
              method: "GET", cache: "no-store",
            }),
          ).then((r) => setDashboardData(r.data)),
        );
      }

      if (activeTab === "laba-rugi") {
        promises.push(
          parseJsonResponse<any>(
            await apiFetch(`/api/finance/reports/laba-rugi?start_date=${start_date}&end_date=${end_date}`, {
              method: "GET", cache: "no-store",
            }),
          ).then((r) => setLabaRugiData(r.data)),
        );
      }

      if (activeTab === "neraca") {
        promises.push(
          parseJsonResponse<any>(
            await apiFetch(`/api/finance/reports/neraca?as_of_date=${end_date}`, {
              method: "GET", cache: "no-store",
            }),
          ).then((r) => setNeracaData(r.data)),
        );
      }

      if (activeTab === "arus-kas") {
        promises.push(
          parseJsonResponse<any>(
            await apiFetch(`/api/finance/reports/arus-kas?start_date=${start_date}&end_date=${end_date}`, {
              method: "GET", cache: "no-store",
            }),
          ).then((r) => setArusKasData(r.data)),
        );
      }

      if (activeTab === "buku-besar") {
        const coaParam = coaFilter ? `&coa_id=${coaFilter}` : "";
        promises.push(
          parseJsonResponse<any>(
            await apiFetch(`/api/finance/reports/buku-besar?start_date=${start_date}&end_date=${end_date}&page=${page}&limit=20${coaParam}`, {
              method: "GET", cache: "no-store",
            }),
          ).then((r) => setBukuBesarData(r.data)),
        );
      }

      if (activeTab === "jurnal-umum") {
        const coaParam = coaFilter ? `&coa_id=${coaFilter}` : "";
        promises.push(
          parseJsonResponse<any>(
            await apiFetch(`/api/finance/jurnal?start_date=${start_date}&end_date=${end_date}&page=${page}&limit=20${coaParam}`, {
              method: "GET", cache: "no-store",
            }),
          ).then((r) => setJurnalData(r.data)),
        );
      }

      await Promise.all(promises);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, dateRange, coaFilter, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "buku-besar" || activeTab === "jurnal-umum") {
      const fetchCoa = async () => {
        try {
          const res = await apiFetch("/api/finance/coa?page=1&limit=200", {
            method: "GET", cache: "no-store",
          });
          const payload = await parseJsonResponse<any>(res);
          setCoaList(payload.data.coa ?? []);
        } catch { /* ignore */ }
      };
      void fetchCoa();
    }
  }, [activeTab]);

  const chartData = useMemo<CashflowPoint[]>(() => {
    if (!dashboardData) return [];
    return [
      {
        bulan: new Date(dateRange.start_date).toLocaleDateString("id-ID", { month: "short" }),
        pemasukan: dashboardData.total_pendapatan,
        pengeluaran: dashboardData.total_pengeluaran,
      },
    ];
  }, [dashboardData, dateRange]);

  const handleExportPDF = useCallback(async () => {
    const { start_date, end_date } = dateRange;

    if (activeTab === "ringkasan" && dashboardData) {
      exportToPDF({
        title: "Ringkasan Keuangan",
        subtitle: `Periode: ${formatDateLong(start_date)} - ${formatDateLong(end_date)}`,
        headers: ["Metrik", "Nilai"],
        rows: [
          ["Total Pendapatan", formatRupiah(dashboardData.total_pendapatan)],
          ["Total Pengeluaran", formatRupiah(dashboardData.total_pengeluaran)],
          ["Saldo Bersih", formatRupiah(dashboardData.saldo_bersih)],
          ["Total Budget", formatRupiah(dashboardData.total_budget)],
          ["Budget Terserap", formatRupiah(dashboardData.budget_terserap)],
          ["Budget Percentage", `${dashboardData.budget_percentage}%`],
          ["Total Payroll", formatRupiah(dashboardData.total_payroll)],
          ["Total Aset", formatRupiah(dashboardData.total_aset)],
          ["Total Piutang", formatRupiah(dashboardData.total_piutang)],
          ["Total Utang", formatRupiah(dashboardData.total_utang)],
          ["Total Kasbon", formatRupiah(dashboardData.total_kasbon)],
        ],
        fileName: exportFileName("ringkasan", start_date, end_date, "pdf"),
        orientation: "landscape",
      });
      return;
    }

    if (activeTab === "laba-rugi" && labaRugiData) {
      const rows = [
        ...labaRugiData.pendapatan.map((i: any) => [i.kode_akun, i.nama_akun, "Pendapatan", formatRupiah(i.saldo)]),
        ...labaRugiData.beban.map((i: any) => [i.kode_akun, i.nama_akun, "Beban", formatRupiah(i.saldo)]),
      ];
      exportToPDF({
        title: "Laporan Laba Rugi",
        subtitle: `Periode: ${formatDateLong(start_date)} - ${formatDateLong(end_date)}`,
        headers: ["Kode Akun", "Nama Akun", "Kategori", "Saldo"],
        rows,
        fileName: exportFileName("laba-rugi", start_date, end_date, "pdf"),
        summary: [
          { label: "Total Pendapatan", value: formatRupiah(labaRugiData.total_pendapatan) },
          { label: "Total Beban", value: formatRupiah(labaRugiData.total_beban) },
          { label: "Laba Bersih", value: formatRupiah(labaRugiData.laba_bersih) },
        ],
      });
      return;
    }

    if (activeTab === "neraca" && neracaData) {
      const rows = [
        ...neracaData.aset.map((i: any) => [i.kode_akun, i.nama_akun, "Aset", formatRupiah(i.saldo)]),
        ...neracaData.liabilitas.map((i: any) => [i.kode_akun, i.nama_akun, "Liabilitas", formatRupiah(i.saldo)]),
        ...neracaData.ekuitas.map((i: any) => [i.kode_akun, i.nama_akun, "Ekuitas", formatRupiah(i.saldo)]),
      ];
      const summary = [
        { label: "Total Aset", value: formatRupiah(neracaData.total_aset) },
        { label: "Total Liabilitas", value: formatRupiah(neracaData.total_liabilitas) },
        { label: "Total Ekuitas", value: formatRupiah(neracaData.total_ekuitas) },
      ];
      if (!neracaData.is_balanced) {
        summary.push({ label: "Selisih", value: formatRupiah(neracaData.difference) });
      }
      exportToPDF({
        title: "Neraca",
        subtitle: `Per ${formatDateLong(end_date)}`,
        headers: ["Kode Akun", "Nama Akun", "Kategori", "Saldo"],
        rows,
        fileName: exportFileName("neraca", end_date, end_date, "pdf"),
        summary,
        footNotes: neracaData.is_balanced ? [] : ["⚠ Neraca tidak balance. Periksa kembali data jurnal."],
      });
      return;
    }

    if (activeTab === "arus-kas" && arusKasData) {
      const rows = arusKasData.detail.map((i: any, idx: number) => [
        (idx + 1).toString(),
        formatDate(i.tanggal),
        i.tipe === "income" ? "Pemasukan" : "Pengeluaran",
        i.tipe_kas || "-",
        formatRupiah(i.amount),
        i.keterangan,
      ]);
      exportToPDF({
        title: "Laporan Arus Kas",
        subtitle: `Periode: ${formatDateLong(start_date)} - ${formatDateLong(end_date)}`,
        headers: ["No", "Tanggal", "Tipe", "Jenis Kas", "Jumlah", "Keterangan"],
        rows,
        fileName: exportFileName("arus-kas", start_date, end_date, "pdf"),
        orientation: "landscape",
        summary: [
          { label: "Total Pemasukan", value: formatRupiah(arusKasData.total_pemasukan) },
          { label: "Total Pengeluaran", value: formatRupiah(arusKasData.total_pengeluaran) },
          { label: "Arus Kas Bersih", value: formatRupiah(arusKasData.arus_kas_bersih) },
        ],
      });
      return;
    }

    if (activeTab === "buku-besar") {
      const allItems = await fetchAllPages<any>(
        "/api/finance/reports/buku-besar",
        { start_date, end_date },
        (data) => data.items,
      );
      const rows: any[][] = [];
      for (const item of allItems) {
        rows.push([item.kode_akun, item.nama_akun, "Saldo Awal", "", "", "", "", "", item.opening_balance]);
        for (const m of item.mutasi) {
          rows.push([
            item.kode_akun,
            item.nama_akun,
            formatDate(m.tanggal),
            m.journal_number || "-",
            m.no_bukti,
            m.keterangan || "-",
            formatRupiah(m.debit),
            formatRupiah(m.kredit),
            formatRupiah(m.saldo),
          ]);
        }
        rows.push([item.kode_akun, item.nama_akun, "Saldo Akhir", "", "", "", "", "", item.closing_balance]);
      }
      exportToPDF({
        title: "Buku Besar",
        subtitle: `Periode: ${formatDateLong(start_date)} - ${formatDateLong(end_date)}`,
        headers: ["Kode Akun", "Nama Akun", "Tanggal", "No Jurnal", "No Bukti", "Keterangan", "Debit", "Kredit", "Saldo"],
        rows,
        fileName: exportFileName("buku-besar", start_date, end_date, "pdf"),
        orientation: "landscape",
      });
      return;
    }

    if (activeTab === "jurnal-umum") {
      const allJurnal = await fetchAllPages(
        "/api/finance/jurnal",
        { start_date, end_date },
        (data) => data.jurnal,
      );
      const rows = (allJurnal ?? []).map((j: any) => [
        j.journal_number || "-",
        formatDate(j.tanggal),
        j.no_bukti,
        j.keterangan || "-",
        `${j.t_journal_item?.length ?? 0} item`,
      ]);
      exportToPDF({
        title: "Jurnal Umum",
        subtitle: `Periode: ${formatDateLong(start_date)} - ${formatDateLong(end_date)}`,
        headers: ["No Jurnal", "Tanggal", "No Bukti", "Keterangan", "Jumlah Item"],
        rows,
        fileName: exportFileName("jurnal-umum", start_date, end_date, "pdf"),
      });
    }
  }, [activeTab, dateRange, dashboardData, labaRugiData, neracaData, arusKasData, bukuBesarData, jurnalData]);

  const handleExportExcel = useCallback(async () => {
    const { start_date, end_date } = dateRange;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan");

    worksheet.mergeCells("A1:F1");
    const titleRow = worksheet.getCell("A1");
    titleRow.value = "PT Doa Suryo Agong";
    titleRow.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1B365D" } };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A2:F2");
    const subtitleRow = worksheet.getCell("A2");
    const tabLabel = TABS.find((t) => t.id === activeTab)?.label || activeTab;
    subtitleRow.value = `${tabLabel} - ${formatDateLong(start_date)} s/d ${formatDateLong(end_date)}`;
    subtitleRow.font = { name: "Arial", size: 12 };
    subtitleRow.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A3:F3");
    const dateRow = worksheet.getCell("A3");
    dateRow.value = `Tanggal Cetak: ${formatDateLong(new Date().toISOString())}`;
    dateRow.font = { name: "Arial", size: 10, italic: true };
    dateRow.alignment = { vertical: "middle", horizontal: "center" };

    let headers: string[] = [];
    let dataRows: any[][] = [];

    if (activeTab === "ringkasan" && dashboardData) {
      headers = ["Metrik", "Nilai"];
      dataRows = [
        ["Total Pendapatan", dashboardData.total_pendapatan],
        ["Total Pengeluaran", dashboardData.total_pengeluaran],
        ["Saldo Bersih", dashboardData.saldo_bersih],
        ["Total Budget", dashboardData.total_budget],
        ["Budget Terserap", dashboardData.budget_terserap],
        ["Budget Percentage", `${dashboardData.budget_percentage}%`],
        ["Total Payroll", dashboardData.total_payroll],
        ["Total Aset", dashboardData.total_aset],
        ["Total Piutang", dashboardData.total_piutang],
        ["Total Utang", dashboardData.total_utang],
        ["Total Kasbon", dashboardData.total_kasbon],
      ];
    } else if (activeTab === "laba-rugi" && labaRugiData) {
      headers = ["Kode Akun", "Nama Akun", "Kategori", "Saldo"];
      dataRows = [
        ...labaRugiData.pendapatan.map((i: any) => [i.kode_akun, i.nama_akun, "Pendapatan", i.saldo]),
        ...labaRugiData.beban.map((i: any) => [i.kode_akun, i.nama_akun, "Beban", i.saldo]),
        ["", "", "Total Pendapatan", labaRugiData.total_pendapatan],
        ["", "", "Total Beban", labaRugiData.total_beban],
        ["", "", "Laba Bersih", labaRugiData.laba_bersih],
      ];
    } else if (activeTab === "neraca" && neracaData) {
      headers = ["Kode Akun", "Nama Akun", "Kategori", "Saldo"];
      dataRows = [
        ...neracaData.aset.map((i: any) => [i.kode_akun, i.nama_akun, "Aset", i.saldo]),
        ...neracaData.liabilitas.map((i: any) => [i.kode_akun, i.nama_akun, "Liabilitas", i.saldo]),
        ...neracaData.ekuitas.map((i: any) => [i.kode_akun, i.nama_akun, "Ekuitas", i.saldo]),
        ["", "", "Total Aset", neracaData.total_aset],
        ["", "", "Total Liabilitas", neracaData.total_liabilitas],
        ["", "", "Total Ekuitas", neracaData.total_ekuitas],
      ];
    } else if (activeTab === "arus-kas" && arusKasData) {
      headers = ["No", "Tanggal", "Tipe", "Jenis Kas", "Jumlah", "Keterangan"];
      dataRows = arusKasData.detail.map((i: any, idx: number) => [
        (idx + 1).toString(), formatDate(i.tanggal),
        i.tipe === "income" ? "Pemasukan" : "Pengeluaran", i.tipe_kas || "-",
        i.amount, i.keterangan,
      ]);
    } else if (activeTab === "buku-besar") {
      headers = ["Kode Akun", "Nama Akun", "Tanggal", "No Jurnal", "No Bukti", "Keterangan", "Debit", "Kredit", "Saldo"];
      const allItems = await fetchAllPages<any>(
        "/api/finance/reports/buku-besar",
        { start_date, end_date },
        (data) => data.items,
      );
      for (const item of allItems) {
        dataRows.push([item.kode_akun, item.nama_akun, "Saldo Awal", "", "", "", "", "", item.opening_balance]);
        for (const m of item.mutasi) {
          dataRows.push([item.kode_akun, item.nama_akun, formatDate(m.tanggal), m.journal_number || "-", m.no_bukti, m.keterangan || "-", m.debit, m.kredit, m.saldo]);
        }
        dataRows.push([item.kode_akun, item.nama_akun, "Saldo Akhir", "", "", "", "", "", item.closing_balance]);
      }
    } else if (activeTab === "jurnal-umum") {
      headers = ["No Jurnal", "Tanggal", "No Bukti", "Keterangan", "Jumlah Item"];
      const allJurnal = await fetchAllPages(
        "/api/finance/jurnal",
        { start_date, end_date },
        (data) => data.jurnal,
      );
      dataRows = (allJurnal ?? []).map((j: any) => [
        j.journal_number || "-", formatDate(j.tanggal), j.no_bukti, j.keterangan || "-",
        j.t_journal_item?.length ?? 0,
      ]);
    }

    const headerRow = worksheet.getRow(5);
    headerRow.values = headers;
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      };
    });

    dataRows.forEach((rowData, index) => {
      const rowIndex = 6 + index;
      const row = worksheet.getRow(rowIndex);
      row.values = rowData;
      const isEven = index % 2 === 0;
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: isEven ? "FFFFFFFF" : "FFF9F9F9" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      });
    });

    worksheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        if (cell.value) {
          maxLen = Math.max(maxLen, String(cell.value).length);
        }
      });
      col.width = maxLen + 3;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), exportFileName(activeTab, start_date, end_date, "xlsx"));
  }, [activeTab, dateRange, dashboardData, labaRugiData, neracaData, arusKasData, bukuBesarData, jurnalData]);

  const renderTabButton = (tab: TabDef) => {
    const isActive = activeTab === tab.id;
    const Icon = tab.icon === "BarChart3" ? BarChart3
      : tab.icon === "TrendingUp" ? TrendingUp
      : tab.icon === "Landmark" ? Landmark
      : tab.icon === "Wallet" ? Wallet
      : tab.icon === "FileText" ? FileText
      : FileSpreadsheet;

    return (
      <button
        key={tab.id}
        onClick={() => handleTabChange(tab.id)}
        className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 px-4 ${
          isActive
            ? "border-[#BC934B] text-white"
            : "border-transparent text-white/60 hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4" />
        {tab.label}
      </button>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Laporan Keuangan</h1>
          <p className="text-sm md:text-base text-slate-300">
            Ringkasan dan analisis laporan keuangan perusahaan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-3 bg-white border border-slate-200 shadow-sm rounded-xl p-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</label>
          <select
            value={periode}
            onChange={(e) => handlePeriodeChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
          >
            {PERIODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {periode === "custom" && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Awal</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => { setCustomStart(e.target.value); setSearchParam("start_date", e.target.value); }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Akhir</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => { setCustomEnd(e.target.value); setSearchParam("end_date", e.target.value); }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              />
            </div>
          </>
        )}

        {(activeTab === "buku-besar" || activeTab === "jurnal-umum") && (
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter COA</label>
            <select
              value={coaFilter}
              onChange={(e) => { setCoaFilter(e.target.value); setSearchParam("coa_id", e.target.value); setPage(1); setSearchParam("page", ""); }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 min-w-[200px]"
            >
              <option value="">Semua Akun</option>
              {coaList.map((coa: any) => (
                <option key={coa.id} value={coa.id}>{coa.kode_akun} - {coa.nama_akun}</option>
              ))}
            </select>
          </div>
        )}

        <div className="text-xs text-slate-500 self-center ml-auto">
          {dateRange.start_date} s/d {dateRange.end_date}
        </div>
      </section>

      <section className="flex flex-wrap gap-1 border-b border-white/10">
        {allowedTabs.map(renderTabButton)}
      </section>

      {error && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</section>
      )}

      {isLoading && (
        <section className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#BC934B]/30 border-t-[#BC934B] rounded-full" />
        </section>
      )}

      {/* ─── TAB: RINGKASAN ─── */}
      {!isLoading && activeTab === "ringkasan" && dashboardData && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0">
                  <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Total Pendapatan</p>
                  <p className="text-base md:text-2xl font-bold text-emerald-600">{formatRupiah(dashboardData.total_pendapatan)}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><TrendingUp className="h-5 w-5" /></span>
              </div>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0">
                  <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Total Pengeluaran</p>
                  <p className="text-base md:text-2xl font-bold text-red-600">{formatRupiah(dashboardData.total_pengeluaran)}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white"><TrendingDown className="h-5 w-5" /></span>
              </div>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0">
                  <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Saldo Bersih</p>
                  <p className={`text-base md:text-2xl font-bold ${dashboardData.saldo_bersih >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(dashboardData.saldo_bersih)}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white"><Wallet className="h-5 w-5" /></span>
              </div>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0">
                  <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Budget Terserap</p>
                  <p className="text-base md:text-2xl font-bold text-amber-600">{formatRupiah(dashboardData.budget_terserap)}</p>
                  <p className="text-xs text-slate-400">{dashboardData.budget_percentage}% dari {formatRupiah(dashboardData.total_budget)}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white"><BarChart3 className="h-5 w-5" /></span>
              </div>
            </article>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Aset</p>
              <p className="text-lg font-bold text-slate-900">{formatRupiah(dashboardData.total_aset)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Piutang</p>
              <p className="text-lg font-bold text-slate-900">{formatRupiah(dashboardData.total_piutang)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Kewajiban</p>
                <p className="text-lg font-bold text-red-600">Utang: {formatRupiah(dashboardData.total_utang)}</p>
                <p className="text-lg font-bold text-amber-600">Kasbon: {formatRupiah(dashboardData.total_kasbon)}</p>
              </div>
            </article>
          </div>

          <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
            <h2 className="text-sm md:text-base font-bold text-slate-900 mb-4">Ringkasan Periode Ini</h2>
            <CashflowLineChart data={chartData} />
          </section>
        </section>
      )}

      {/* ─── TAB: LABA RUGI ─── */}
      {!isLoading && activeTab === "laba-rugi" && labaRugiData && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pendapatan</p>
              <p className="text-lg font-bold text-emerald-600">{formatRupiah(labaRugiData.total_pendapatan)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Beban</p>
              <p className="text-lg font-bold text-red-600">{formatRupiah(labaRugiData.total_beban)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Laba Bersih</p>
              <p className={`text-lg font-bold ${labaRugiData.laba_bersih >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(labaRugiData.laba_bersih)}</p>
            </article>
          </div>

          <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Detail Laba Rugi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Kode Akun</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Nama Akun</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Kategori</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labaRugiData.pendapatan.map((item: any) => (
                    <tr key={item.kode_akun} className="hover:bg-slate-50/70">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{item.kode_akun}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{item.nama_akun}</td>
                      <td className="px-4 md:px-6 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700">Pendapatan</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-emerald-600">{formatRupiah(item.saldo)}</td>
                    </tr>
                  ))}
                  {labaRugiData.beban.map((item: any) => (
                    <tr key={item.kode_akun} className="hover:bg-slate-50/70">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{item.kode_akun}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{item.nama_akun}</td>
                      <td className="px-4 md:px-6 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700">Beban</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-red-600">{formatRupiah(item.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {/* ─── TAB: NERACA ─── */}
      {!isLoading && activeTab === "neraca" && neracaData && (
        <section className="space-y-4">
          {!neracaData.is_balanced && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Neraca tidak balance. Selisih: <strong>{formatRupiah(neracaData.difference)}</strong>. Periksa kembali data jurnal.</span>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Aset</p>
              <p className="text-lg font-bold text-blue-600">{formatRupiah(neracaData.total_aset)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Liabilitas</p>
              <p className="text-lg font-bold text-red-600">{formatRupiah(neracaData.total_liabilitas)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Ekuitas</p>
              <p className="text-lg font-bold text-emerald-600">{formatRupiah(neracaData.total_ekuitas)}</p>
            </article>
          </div>

          {neracaData.aset.length > 0 && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Aset</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Kode Akun</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Nama Akun</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {neracaData.aset.map((item: any) => (
                      <tr key={item.kode_akun} className="hover:bg-slate-50/70">
                        <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{item.kode_akun}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{item.nama_akun}</td>
                        <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-blue-600">{formatRupiah(item.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {neracaData.liabilitas.length > 0 && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Liabilitas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Kode Akun</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Nama Akun</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {neracaData.liabilitas.map((item: any) => (
                      <tr key={item.kode_akun} className="hover:bg-slate-50/70">
                        <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{item.kode_akun}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{item.nama_akun}</td>
                        <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-red-600">{formatRupiah(item.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {neracaData.ekuitas.length > 0 && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Ekuitas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Kode Akun</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Nama Akun</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {neracaData.ekuitas.map((item: any) => (
                      <tr key={item.kode_akun} className="hover:bg-slate-50/70">
                        <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{item.kode_akun}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{item.nama_akun}</td>
                        <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-emerald-600">{formatRupiah(item.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>
      )}

      {/* ─── TAB: ARUS KAS ─── */}
      {!isLoading && activeTab === "arus-kas" && arusKasData && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pemasukan</p>
              <p className="text-lg font-bold text-emerald-600">{formatRupiah(arusKasData.total_pemasukan)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pengeluaran</p>
              <p className="text-lg font-bold text-red-600">{formatRupiah(arusKasData.total_pengeluaran)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Arus Kas Bersih</p>
              <p className={`text-lg font-bold ${arusKasData.arus_kas_bersih >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(arusKasData.arus_kas_bersih)}</p>
            </article>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Kas Besar / Kecil</p>
              <p className="text-sm font-semibold text-slate-900">Besar: {formatRupiah(arusKasData.kas_besar.pemasukan - arusKasData.kas_besar.pengeluaran)}</p>
              <p className="text-sm font-semibold text-slate-600">Kecil: {formatRupiah(arusKasData.kas_kecil.pemasukan - arusKasData.kas_kecil.pengeluaran)}</p>
            </article>
          </div>

          <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Detail Transaksi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">No</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Tanggal</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Tipe</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Jenis Kas</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Jumlah</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {arusKasData.detail.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{index + 1}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{formatDate(item.tanggal)}</td>
                      <td className="px-4 md:px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.tipe === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {item.tipe === "income" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{item.tipe_kas || "-"}</td>
                      <td className={`px-4 md:px-6 py-3 text-sm font-semibold text-right ${item.tipe === "income" ? "text-emerald-600" : "text-red-600"}`}>
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-800 max-w-xs truncate">{item.keterangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {/* ─── TAB: BUKU BESAR ─── */}
      {!isLoading && activeTab === "buku-besar" && bukuBesarData && (
        <section className="space-y-6">
          {bukuBesarData.items.map((item: any) => (
            <section key={item.coa_id} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.kode_akun} - {item.nama_akun}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Saldo Awal: <strong className="text-slate-800">{formatRupiah(item.opening_balance)}</strong></span>
                  <span>Saldo Akhir: <strong className="text-slate-800">{formatRupiah(item.closing_balance)}</strong></span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Tanggal</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">No Jurnal</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">No Bukti</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Keterangan</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Debit</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Kredit</th>
                      <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {item.mutasi.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center">Tidak ada transaksi pada periode ini.</td>
                      </tr>
                    ) : (
                      item.mutasi.map((m: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{formatDate(m.tanggal)}</td>
                          <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{m.journal_number || "-"}</td>
                          <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{m.no_bukti}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{m.keterangan || "-"}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-right text-slate-800">{m.debit > 0 ? formatRupiah(m.debit) : "-"}</td>
                          <td className="px-4 md:px-6 py-3 text-sm text-right text-slate-800">{m.kredit > 0 ? formatRupiah(m.kredit) : "-"}</td>
                          <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-slate-900">{formatRupiah(m.saldo)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {bukuBesarData.meta && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Halaman {bukuBesarData.meta.page} dari {Math.ceil(bukuBesarData.meta.total / bukuBesarData.meta.limit)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPage(Math.max(1, page - 1)); setSearchParam("page", String(Math.max(1, page - 1))); }}
                  disabled={page <= 1}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >Sebelumnya</button>
                <button
                  onClick={() => { setPage(page + 1); setSearchParam("page", String(page + 1)); }}
                  disabled={page * bukuBesarData.meta.limit >= bukuBesarData.meta.total}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >Selanjutnya</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB: JURNAL UMUM ─── */}
      {!isLoading && activeTab === "jurnal-umum" && jurnalData && (
        <section className="space-y-4">
          <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Daftar Jurnal Umum</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">No Jurnal</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Tanggal</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">No Bukti</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500">Keterangan</th>
                    <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase text-slate-500 text-right">Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(jurnalData.jurnal ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center">Tidak ada data jurnal.</td>
                    </tr>
                  ) : (
                    (jurnalData.jurnal ?? []).map((j: any) => (
                      <tr key={j.id} className="hover:bg-slate-50/70">
                        <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{j.journal_number || "-"}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{formatDate(j.tanggal)}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{j.no_bukti}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-800 max-w-xs truncate">{j.keterangan || "-"}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-right text-slate-600">{j.t_journal_item?.length ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {jurnalData.meta && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Halaman {jurnalData.meta.page} dari {Math.ceil(jurnalData.meta.total / jurnalData.meta.limit)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPage(Math.max(1, page - 1)); setSearchParam("page", String(Math.max(1, page - 1))); }}
                  disabled={page <= 1}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >Sebelumnya</button>
                <button
                  onClick={() => { setPage(page + 1); setSearchParam("page", String(page + 1)); }}
                  disabled={page * jurnalData.meta.limit >= jurnalData.meta.total}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >Selanjutnya</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
