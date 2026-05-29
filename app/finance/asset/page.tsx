"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Building, 
  PlusCircle, 
  Trash2, 
  Edit, 
  Search, 
  Calendar, 
  Coins, 
  Activity, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  TrendingDown,
  DollarSign
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiSuccess, ApiError } from "@/types/api";
import type { TAsset, TAssetDepreciationSchedule, MCOA } from "@/types/supabase";
import { 
  useAsset, useInsertAsset, useUpdateAsset, useDeleteAsset,
  useAssetDepreciationSchedule, useInsertAssetDepreciationSchedule, useUpdateAssetDepreciationSchedule, useDeleteAssetDepreciationSchedule
} from "@/lib/supabase/hooks/use-finance";

type CoaListPayload = {
  coa: MCOA[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

// Helper to compute standard depreciation schedule
function calculateSchedule(
  nilaiPerolehan: number,
  nilaiResidu: number,
  masaManfaatBulan: number,
  metodePenyusutan: "straight_line" | "double_declining" | "none",
  tanggalPerolehan: string
): Array<{ periode: string; jumlahPenyusutan: number }> {
  if (metodePenyusutan === "none" || nilaiPerolehan <= 0 || masaManfaatBulan <= 0) {
    return [];
  }

  const startDate = new Date(tanggalPerolehan);
  const schedule: Array<{ periode: string; jumlahPenyusutan: number }> = [];

  if (metodePenyusutan === "straight_line") {
    const totalDepreciable = nilaiPerolehan - nilaiResidu;
    const monthlyDepreciation = Math.round(totalDepreciable / masaManfaatBulan);

    for (let i = 0; i < masaManfaatBulan; i++) {
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      
      let amount = monthlyDepreciation;
      if (i === masaManfaatBulan - 1) {
        const sumPrevious = monthlyDepreciation * (masaManfaatBulan - 1);
        amount = totalDepreciable - sumPrevious;
      }

      schedule.push({
        periode: `${year}-${month}`,
        jumlahPenyusutan: Math.max(0, amount),
      });
    }
  } else if (metodePenyusutan === "double_declining") {
    const monthlyRate = 2 / masaManfaatBulan;
    let bookValue = nilaiPerolehan;
    const totalDepreciable = nilaiPerolehan - nilaiResidu;
    let accumulatedDepreciation = 0;

    for (let i = 0; i < masaManfaatBulan; i++) {
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");

      let amount = Math.round(bookValue * monthlyRate);
      
      if (accumulatedDepreciation + amount > totalDepreciable) {
        amount = totalDepreciable - accumulatedDepreciation;
      }

      if (i === masaManfaatBulan - 1) {
        amount = totalDepreciable - accumulatedDepreciation;
      }

      accumulatedDepreciation += amount;
      bookValue -= amount;

      schedule.push({
        periode: `${year}-${month}`,
        jumlahPenyusutan: Math.max(0, amount),
      });
    }
  }

  return schedule;
}

export default function AssetManagementPage() {
  const [activeTab, setActiveTab] = useState<"daftar" | "jadwal">("daftar");
  const [searchTerm, setSearchTerm] = useState("");
  const [coaOptions, setCoaOptions] = useState<MCOA[]>([]);
  
  // Custom hook integrations for assets
  const { data: assets, loading: assetsLoading, refresh: refreshAssets } = useAsset();
  const { insert: insertAsset, loading: isInserting } = useInsertAsset();
  const { update: updateAsset, loading: isUpdating } = useUpdateAsset();
  const { remove: deleteAsset } = useDeleteAsset();

  // Custom hook integrations for depreciation schedule
  const { data: schedules, loading: schedulesLoading, refresh: refreshSchedules } = useAssetDepreciationSchedule({ limit: 1000 });
  const { insert: insertSchedule } = useInsertAssetDepreciationSchedule();
  const { update: updateSchedule } = useUpdateAssetDepreciationSchedule();
  const { remove: deleteSchedule } = useDeleteAssetDepreciationSchedule();

  // State Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<TAsset | null>(null);
  
  // Posting journal loading states
  const [postingId, setPostingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    kode_aset: "",
    nama_aset: "",
    tanggal_perolehan: new Date().toISOString().split("T")[0],
    nilai_perolehan: "",
    nilai_residu: "0",
    masa_manfaat_bulan: "48",
    metode_penyusutan: "straight_line" as "straight_line" | "double_declining" | "none",
    coa_asset_id: "",
    coa_depr_accumulation_id: "",
    coa_depr_expense_id: "",
    keterangan: "",
    status: "active",
  });

  const coaMap = useMemo(() => {
    return new Map<string, MCOA>(coaOptions.map((c: MCOA) => [c.id, c]));
  }, [coaOptions]);

  // Fetch COA
  useEffect(() => {
    const fetchCoa = async () => {
      try {
        const response = await apiFetch("/api/finance/coa?page=1&limit=500");
        const payload = (await response.json()) as ApiSuccess<CoaListPayload> | ApiError;
        if (response.ok && payload.success) {
          setCoaOptions(payload.data.coa ?? []);
        }
      } catch (err) {
        console.error("Gagal mengambil data COA", err);
      }
    };
    fetchCoa();
  }, []);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    return assets.filter((item: TAsset) => {
      const nameMatch = item.nama_aset?.toLowerCase().includes(searchTerm.toLowerCase());
      const codeMatch = item.kode_aset?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || codeMatch;
    });
  }, [assets, searchTerm]);

  // Generate automated asset code
  const handleOpenAddModal = () => {
    setSelectedAsset(null);
    const nextNum = String((assets?.length || 0) + 1).padStart(4, "0");
    const yearMonth = new Date().toISOString().slice(2, 7).replace("-", "");
    setFormData({
      kode_aset: `AST-${yearMonth}-${nextNum}`,
      nama_aset: "",
      tanggal_perolehan: new Date().toISOString().split("T")[0],
      nilai_perolehan: "",
      nilai_residu: "0",
      masa_manfaat_bulan: "48",
      metode_penyusutan: "straight_line",
      coa_asset_id: coaOptions.find((c: MCOA) => c.kode_akun?.startsWith("1101.01.01.02") && c.kode_akun !== "1101.01.01.02")?.id || "",
      coa_depr_accumulation_id: coaOptions.find((c: MCOA) => c.kode_akun === "1203" || (c.kode_akun?.startsWith("1") && c.nama_akun?.toLowerCase().includes("akum")))?.id || "",
      coa_depr_expense_id: coaOptions.find((c: MCOA) => c.kode_akun === "6004" || c.kode_akun?.startsWith("5") || c.kode_akun?.startsWith("6"))?.id || "",
      keterangan: "",
      status: "active",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (asset: TAsset) => {
    setSelectedAsset(asset);
    setFormData({
      kode_aset: asset.kode_aset || "",
      nama_aset: asset.nama_aset || "",
      tanggal_perolehan: asset.tanggal_perolehan || "",
      nilai_perolehan: String(asset.nilai_perolehan || ""),
      nilai_residu: String(asset.nilai_residu || "0"),
      masa_manfaat_bulan: String(asset.masa_manfaat_bulan || "48"),
      metode_penyusutan: (asset.metode_penyusutan as any) || "straight_line",
      coa_asset_id: asset.coa_asset_id || "",
      coa_depr_accumulation_id: asset.coa_depr_accumulation_id || "",
      coa_depr_expense_id: asset.coa_depr_expense_id || "",
      keterangan: asset.keterangan || "",
      status: asset.status || "active",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenViewSchedule = (asset: TAsset) => {
    setSelectedAsset(asset);
    setIsViewScheduleModalOpen(true);
  };

  const handleDeleteClick = (asset: TAsset) => {
    setSelectedAsset(asset);
    setIsDeleteModalOpen(true);
  };

  // Submit Assets Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_aset || !formData.nilai_perolehan || !formData.coa_asset_id || !formData.coa_depr_accumulation_id || !formData.coa_depr_expense_id) {
      alert("Harap lengkapi semua field wajib termasuk mapping COA.");
      return;
    }

    const nilaiPerolehan = Number(formData.nilai_perolehan);
    const nilaiResidu = Number(formData.nilai_residu);
    const masaManfaat = Number(formData.masa_manfaat_bulan);

    const payload = {
      kode_aset: formData.kode_aset,
      nama_aset: formData.nama_aset,
      tanggal_perolehan: formData.tanggal_perolehan,
      nilai_perolehan: nilaiPerolehan,
      nilai_residu: nilaiResidu,
      masa_manfaat_bulan: masaManfaat,
      metode_penyusutan: formData.metode_penyusutan,
      coa_asset_id: formData.coa_asset_id,
      coa_depr_accumulation_id: formData.coa_depr_accumulation_id,
      coa_depr_expense_id: formData.coa_depr_expense_id,
      keterangan: formData.keterangan,
      status: formData.status,
    };

    if (selectedAsset) {
      // Edit Asset
      const result = await updateAsset(selectedAsset.id, payload);
      if (result) {
        setIsFormModalOpen(false);
        refreshAssets();
        refreshSchedules();
      } else {
        alert("Gagal mengupdate data aset.");
      }
    } else {
      // Create Asset
      const newAsset = await insertAsset(payload);
      if (newAsset) {
        // Calculate & Insert Depreciation Schedule
        const schedule = calculateSchedule(
          nilaiPerolehan,
          nilaiResidu,
          masaManfaat,
          formData.metode_penyusutan,
          formData.tanggal_perolehan
        );

        // Sequence inserts for schedule
        for (const item of schedule) {
          await insertSchedule({
            asset_id: newAsset.id,
            periode: item.periode,
            jumlah_penyusutan: item.jumlahPenyusutan,
            is_posted: false,
          });
        }

        setIsFormModalOpen(false);
        refreshAssets();
        refreshSchedules();
      } else {
        alert("Gagal menambahkan aset baru.");
      }
    }
  };

  // Confirm delete asset
  const handleConfirmDelete = async () => {
    if (!selectedAsset) return;

    // First delete its schedules
    const assetSchedules = schedules?.filter((s: TAssetDepreciationSchedule) => s.asset_id === selectedAsset.id) || [];
    for (const s of assetSchedules) {
      await deleteSchedule(s.id);
    }

    const success = await deleteAsset(selectedAsset.id);
    if (success) {
      setIsDeleteModalOpen(false);
      refreshAssets();
      refreshSchedules();
    } else {
      alert("Gagal menghapus aset.");
    }
  };

  // Post Journal for Depreciation Schedule Row
  const handlePostJournal = async (schedule: TAssetDepreciationSchedule) => {
    if (postingId) return;
    setPostingId(schedule.id);

    const asset = assets?.find((a: TAsset) => a.id === schedule.asset_id);
    if (!asset) {
      alert("Data aset tidak ditemukan.");
      setPostingId(null);
      return;
    }

    try {
      // 1. Create Jurnal header
      const journalRes = await apiFetch("/api/finance/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: `${schedule.periode}-01`,
          no_bukti: `AST-DEP-${asset.kode_aset}-${schedule.periode}`,
          keterangan: `Penyusutan Aset Tetap: ${asset.nama_aset} - Periode ${schedule.periode}`,
        }),
      });
      
      const journalPayload = (await journalRes.json()) as any;
      if (!journalRes.ok || !journalPayload.success) {
        throw new Error(journalPayload.error?.message || "Gagal membuat jurnal.");
      }

      const journalId = journalPayload.data.jurnal.id;

      // 2. Create Debit Jurnal Item (Beban Penyusutan)
      const debitRes = await apiFetch("/api/finance/jurnal-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journal_id: journalId,
          coa_id: asset.coa_depr_expense_id,
          debit: schedule.jumlah_penyusutan || 0,
          kredit: 0,
        }),
      });

      if (!debitRes.ok) {
        throw new Error("Gagal membuat item debit jurnal.");
      }

      // 3. Create Credit Jurnal Item (Akumulasi Penyusutan)
      const creditRes = await apiFetch("/api/finance/jurnal-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journal_id: journalId,
          coa_id: asset.coa_depr_accumulation_id,
          debit: 0,
          kredit: schedule.jumlah_penyusutan || 0,
        }),
      });

      if (!creditRes.ok) {
        throw new Error("Gagal membuat item kredit jurnal.");
      }

      // 4. Update schedule is_posted status & journal_id reference
      await updateSchedule(schedule.id, {
        is_posted: true,
        journal_id: journalId,
      });

      refreshSchedules();
      alert("Jurnal penyusutan berhasil diposting!");
    } catch (err: any) {
      alert(err.message || "Gagal memposting jurnal.");
    } finally {
      setPostingId(null);
    }
  };

  // Dynamic Statistics Calculations
  const stats = useMemo(() => {
    if (!assets) return { totalValue: 0, activeCount: 0, totalDepr: 0, netValue: 0 };
    const totalValue = assets.reduce((sum: number, item: TAsset) => sum + (item.nilai_perolehan || 0), 0);
    const activeCount = assets.filter((item: TAsset) => item.status === "active").length;
    const totalDepr = schedules?.filter((s: TAssetDepreciationSchedule) => s.is_posted).reduce((sum: number, s: TAssetDepreciationSchedule) => sum + (s.jumlah_penyusutan || 0), 0) || 0;
    const netValue = totalValue - totalDepr;

    return { totalValue, activeCount, totalDepr, netValue };
  }, [assets, schedules]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <section className="flex flex-col sm:flex-row justify-between gap-3 items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Pengelolaan Aset Tetap
          </h1>
          <p className="text-white/85 text-sm mt-1">
            Kelola inventaris, hitung depresiasi secara otomatis, dan buat entri jurnal penyusutan berkala.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#BC934B]/10 transition-all hover:bg-[#A88444] hover:shadow-[#A88444]/20 active:scale-95"
        >
          <PlusCircle size={18} />
          Registrasi Aset Baru
        </button>
      </section>

      {/* Stats Cards */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Asset Value */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/80 transition-all hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-slate-100/50">
            <Building size={96} className="opacity-10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Nilai Aset</p>
          <h3 className="mt-3 text-2xl font-black text-slate-900">{formatRupiah(stats.totalValue)}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-[#BC934B] font-semibold">
            <Coins size={14} /> Nilai historis perolehan
          </p>
        </div>

        {/* Count Active Assets */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/80 transition-all hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-slate-100/50">
            <Activity size={96} className="opacity-10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Aset Aktif</p>
          <h3 className="mt-3 text-2xl font-black text-slate-900">{stats.activeCount} <span className="text-sm font-medium text-slate-500">Unit</span></h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <CheckCircle size={14} /> Berstatus aktif & terdepresiasi
          </p>
        </div>

        {/* Total Accumulated Depreciation */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/80 transition-all hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-slate-100/50">
            <TrendingDown size={96} className="opacity-10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Akumulasi Penyusutan</p>
          <h3 className="mt-3 text-2xl font-black text-slate-900">{formatRupiah(stats.totalDepr)}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-amber-600 font-semibold">
            <BookOpen size={14} /> Telah terposting ke Jurnal Umum
          </p>
        </div>

        {/* Net Book Value */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/80 transition-all hover:-translate-y-0.5">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-slate-100/50">
            <DollarSign size={96} className="opacity-10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nilai Buku Bersih (NBV)</p>
          <h3 className="mt-3 text-2xl font-black text-[#BC934B]">{formatRupiah(stats.netValue)}</h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-[#BC934B] font-semibold">
            <ArrowRight size={14} /> Nilai sisa aset saat ini
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab("daftar")}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 px-6 ${
            activeTab === "daftar"
              ? "border-[#BC934B] text-white"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          Daftar Aset Tetap
        </button>
        <button
          onClick={() => setActiveTab("jadwal")}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 px-6 ${
            activeTab === "jadwal"
              ? "border-[#BC934B] text-white"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          Jadwal & Posting Penyusutan
        </button>
      </div>

      {/* TAB CONTENT: DAFTAR ASET */}
      {activeTab === "daftar" && (
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari aset berdasarkan kode atau nama..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Kode / Nama Aset</th>
                  <th className="px-6 py-4">Tgl Perolehan</th>
                  <th className="px-6 py-4">Nilai Perolehan</th>
                  <th className="px-6 py-4">Sisa Manfaat</th>
                  <th className="px-6 py-4">Metode</th>
                  <th className="px-6 py-4">Akun Aset (COA)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assetsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Memuat data aset...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada aset terdaftar.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset: TAsset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{asset.nama_aset}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{asset.kode_aset}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {asset.tanggal_perolehan ? formatDate(asset.tanggal_perolehan) : "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-bold">
                        {formatRupiah(asset.nilai_perolehan || 0)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {asset.masa_manfaat_bulan} Bulan
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          asset.metode_penyusutan === "straight_line" 
                            ? "bg-sky-50 text-sky-700 border border-sky-100" 
                            : asset.metode_penyusutan === "double_declining"
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-slate-50 text-slate-600"
                        }`}>
                          {asset.metode_penyusutan === "straight_line" 
                            ? "Garis Lurus" 
                            : asset.metode_penyusutan === "double_declining"
                            ? "Saldo Menurun"
                            : "Tanpa Penyusutan"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        <div>Asset: {coaMap.get(asset.coa_asset_id || "")?.kode_akun || "-"}</div>
                        <div className="mt-0.5">Akum: {coaMap.get(asset.coa_depr_accumulation_id || "")?.kode_akun || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          asset.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${asset.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                          {asset.status === "active" ? "Aktif" : "Disposed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenViewSchedule(asset)}
                            title="Lihat Proyeksi Penyusutan"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Calendar size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(asset)}
                            title="Edit Aset"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(asset)}
                            title="Hapus Aset"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: JADWAL & POSTING */}
      {activeTab === "jadwal" && (
        <div className="rounded-2xl bg-white p-6 border border-slate-200/80">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-slate-600 text-sm font-medium">
              Daftar seluruh jadwal depresiasi per periode bulanan. Pastikan depresiasi diposting setiap bulannya.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Aset</th>
                  <th className="px-6 py-4">Periode</th>
                  <th className="px-6 py-4">Jumlah Depresiasi</th>
                  <th className="px-6 py-4">Status Posting</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedulesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Memuat data jadwal depresiasi...
                    </td>
                  </tr>
                ) : !schedules || schedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada jadwal depresiasi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule: TAssetDepreciationSchedule) => {
                    const asset = assets?.find((a: TAsset) => a.id === schedule.asset_id);
                    if (!asset) return null;
                    return (
                      <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{asset.nama_aset}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{asset.kode_aset}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#BC934B]">
                          {schedule.periode}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {formatRupiah(schedule.jumlah_penyusutan || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            schedule.is_posted
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {schedule.is_posted ? (
                              <>
                                <CheckCircle size={14} className="text-emerald-500" />
                                Terposting
                              </>
                            ) : (
                              <>
                                <XCircle size={14} className="text-amber-500" />
                                Belum Diposting
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {schedule.is_posted ? (
                            <span className="text-xs text-slate-400 font-medium">No Jurnal: {schedule.journal_id ? "Posted" : "-"}</span>
                          ) : (
                            <button
                              onClick={() => handlePostJournal(schedule)}
                              disabled={postingId === schedule.id}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#BC934B] px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-[#A88444] disabled:opacity-50"
                            >
                              {postingId === schedule.id ? "Memproses..." : "Posting Jurnal"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL: REGISTER / EDIT ASSET */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedAsset ? "Edit Detail Aset" : "Registrasi Aset Tetap Baru"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Kode Aset */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Kode Aset</label>
              <input
                type="text"
                value={formData.kode_aset}
                onChange={e => setFormData({ ...formData, kode_aset: e.target.value })}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              />
            </div>

            {/* Nama Aset */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nama Aset *</label>
              <input
                type="text"
                value={formData.nama_aset}
                onChange={e => setFormData({ ...formData, nama_aset: e.target.value })}
                required
                placeholder="Contoh: Laptop Macbook Pro"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              />
            </div>

            {/* Tanggal Perolehan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal Perolehan *</label>
              <input
                type="date"
                value={formData.tanggal_perolehan}
                onChange={e => setFormData({ ...formData, tanggal_perolehan: e.target.value })}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              />
            </div>

            {/* Metode Penyusutan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Metode Penyusutan *</label>
              <select
                value={formData.metode_penyusutan}
                onChange={e => setFormData({ ...formData, metode_penyusutan: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              >
                <option value="straight_line">Garis Lurus (Straight Line)</option>
                <option value="double_declining">Saldo Menurun Ganda (Double Declining)</option>
                <option value="none">Tanpa Penyusutan (Non-depreciable)</option>
              </select>
            </div>

            {/* Nilai Perolehan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nilai Perolehan (Harga Beli) *</label>
              <input
                type="number"
                value={formData.nilai_perolehan}
                onChange={e => setFormData({ ...formData, nilai_perolehan: e.target.value })}
                required
                placeholder="Contoh: 15000000"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              />
            </div>

            {/* Nilai Residu */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nilai Residu (Nilai Sisa)</label>
              <input
                type="number"
                value={formData.nilai_residu}
                onChange={e => setFormData({ ...formData, nilai_residu: e.target.value })}
                placeholder="Contoh: 1000000"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              />
            </div>

            {/* Masa Manfaat (Bulan) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Masa Manfaat (Bulan) *</label>
              <input
                type="number"
                value={formData.masa_manfaat_bulan}
                onChange={e => setFormData({ ...formData, masa_manfaat_bulan: e.target.value })}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Status *</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
              >
                <option value="active">Aktif</option>
                <option value="disposed">Disposed / Dilepas</option>
              </select>
            </div>
          </div>

          {/* COA Mapping Section */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <BookOpen size={16} className="text-[#BC934B]" /> Akuntansi & Pemetaan COA (Chart of Accounts)
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* COA Asset */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Akun Aset (Debet Awal) *</label>
                <select
                  value={formData.coa_asset_id}
                  onChange={e => setFormData({ ...formData, coa_asset_id: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-[#BC934B]"
                >
                  <option value="">Pilih COA...</option>
                  {coaOptions
                    .filter((coa: MCOA) => coa.kode_akun?.startsWith("1101.01.01.02") && coa.kode_akun !== "1101.01.01.02")
                    .map((coa: MCOA) => (
                      <option key={coa.id} value={coa.id}>
                        {coa.kode_akun} - {coa.nama_akun}
                      </option>
                    ))}
                </select>
              </div>

              {/* COA Accumulation */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Akumulasi Penyusutan *</label>
                <select
                  value={formData.coa_depr_accumulation_id}
                  onChange={e => setFormData({ ...formData, coa_depr_accumulation_id: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-[#BC934B]"
                >
                  <option value="">Pilih COA...</option>
                  {coaOptions
                    .filter((coa: MCOA) => coa.kode_akun?.startsWith("1203"))
                    .map((coa: MCOA) => (
                      <option key={coa.id} value={coa.id}>
                        {coa.kode_akun} - {coa.nama_akun}
                      </option>
                    ))}
                </select>
              </div>

              {/* COA Expense */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Beban Penyusutan (Kredit) *</label>
                <select
                  value={formData.coa_depr_expense_id}
                  onChange={e => setFormData({ ...formData, coa_depr_expense_id: e.target.value })}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-[#BC934B]"
                >
                  <option value="">Pilih COA...</option>
                  {coaOptions
                    .filter((coa: MCOA) => coa.kode_akun?.startsWith("6004"))
                    .map((coa: MCOA) => (
                      <option key={coa.id} value={coa.id}>
                        {coa.kode_akun} - {coa.nama_akun}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Keterangan / Rincian Tambahan</label>
            <textarea
              value={formData.keterangan}
              onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#BC934B]"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isInserting || isUpdating}
              className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#A88444] transition-colors disabled:opacity-50"
            >
              {isInserting || isUpdating ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW INDIVIDUAL SCHEDULE MODAL */}
      <Modal
        isOpen={isViewScheduleModalOpen}
        onClose={() => setIsViewScheduleModalOpen(false)}
        title={selectedAsset ? `Jadwal Depresiasi: ${selectedAsset.nama_aset}` : "Jadwal Depresiasi"}
        maxWidth="max-w-xl"
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                  <th className="px-5 py-3">Periode</th>
                  <th className="px-5 py-3">Penyusutan</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!selectedAsset || schedules?.filter((s: TAssetDepreciationSchedule) => s.asset_id === selectedAsset.id).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                      Jadwal penyusutan belum dihasilkan untuk aset ini.
                    </td>
                  </tr>
                ) : (
                  schedules
                    ?.filter((s: TAssetDepreciationSchedule) => s.asset_id === selectedAsset.id)
                    .map((item: TAssetDepreciationSchedule) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-mono text-[#BC934B] font-bold">{item.periode}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{formatRupiah(item.jumlah_penyusutan || 0)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.is_posted
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {item.is_posted ? "Terposting" : "Belum Diposting"}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => setIsViewScheduleModalOpen(false)}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Tutup
          </button>
        </div>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Registrasi Aset?"
        description={`Apakah Anda yakin ingin menghapus data aset "${selectedAsset?.nama_aset}"? Seluruh proyeksi dan jadwal depresiasi yang belum terposting juga akan ikut terhapus secara permanen.`}
      />
    </div>
  );
}
