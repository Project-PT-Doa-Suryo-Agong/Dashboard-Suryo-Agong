"use client";
import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { apiFetch } from "@/lib/utils/api-fetch";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, DetailButton, DeleteButton } from "@/components/ui/RowActions";
import { FileText, PlusCircle } from "lucide-react";
import type { TPKWT } from "@/types/supabase";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default function PKWTPage() {
  const [tab, setTab] = useState<"generate" | "history">("generate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [templateType, setTemplateType] = useState<"pkwt" | "pkwtp">("pkwt");
  const [form, setForm] = useState<Record<string, any>>({
    contract_number: "",
    employee_name: "",
    employee_nik: "",
    employee_identity_number: "",
    employee_address: "",
    employee_position: "",
    employee_department: "",
    contract_start_date: "",
    contract_end_date: "",
    probation_months: "",
    probation_end_date: "",
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const [history, setHistory] = useState<TPKWT[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (tab === "history") fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  async function fetchHistory() {
    setIsLoadingHistory(true);
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : "";
      const res = await apiFetch(`/api/hr/pkwt?page=${page}&limit=50${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal mengambil riwayat.");
      setHistory(data.pkwt ?? []);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal mengambil riwayat kontrak.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const handleGenerate = async (e?: Event) => {
    e?.preventDefault?.();
    if (isSubmitting) return;

    // Basic validation
    if (!form.employee_name || !form.contract_start_date) {
      alert("Nama karyawan dan tanggal mulai kontrak wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        templateType,
        employee: { ...form },
      };

      const res = await apiFetch(`/api/hr/pkwt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        if (data?.missingFields) {
          alert("Informasi karyawan belum lengkap: " + data.missingFields.join(", "));
        } else {
          throw new Error(data?.message || "Gagal generate kontrak.");
        }
        return;
      }

      const generated = data.pkwt as TPKWT | undefined;
      if (generated) {
        setPreviewContent(generated.generated_content ?? "");
        setPreviewOpen(true);
      } else if (data.draft?.content) {
        setPreviewContent(data.draft.content ?? "");
        setPreviewOpen(true);
      }

      // refresh history when available
      if (tab === "history") fetchHistory();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal generate kontrak.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!previewContent) return;
    const blob = new Blob([previewContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.employee_name ?? "kontrak"}-${templateType}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!previewContent) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Preview Kontrak</title><style>body{font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:24px;} pre{white-space:pre-wrap;}</style></head><body><pre>${previewContent.replace(/</g, "&lt;")}</pre></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const openDelete = (id: string) => { setDeleteId(id); setIsDeleteOpen(true); };
  const closeDelete = () => { setDeleteId(null); setIsDeleteOpen(false); };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiFetch(`/api/hr/pkwt/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Gagal menghapus riwayat.");
      fetchHistory();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal menghapus riwayat.");
    } finally {
      closeDelete();
    }
  };

  const filtered = useMemo(() => {
    if (!search) return history;
    const kw = search.toLowerCase();
    return history.filter(h => (h.employee_name ?? "").toLowerCase().includes(kw) || (h.contract_number ?? "").toLowerCase().includes(kw));
  }, [history, search]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-6xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">PKWT / PKWTP</h1>
        <p className="text-sm md:text-base text-slate-200">Generate kontrak kerja tertentu dan simpan riwayatnya.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("generate")} className={`rounded-xl px-4 py-2 text-sm ${tab === "generate" ? "bg-slate-700 text-white" : "bg-white text-slate-700"}`}>Generate Kontrak</button>
        <button onClick={() => setTab("history")} className={`rounded-xl px-4 py-2 text-sm ${tab === "history" ? "bg-slate-700 text-white" : "bg-white text-slate-700"}`}>Riwayat Kontrak</button>
      </div>

      {tab === "generate" ? (
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(e.nativeEvent as any); }} className="space-y-4 bg-white rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <div className="text-sm font-medium text-slate-700">Tipe Template</div>
              <select value={templateType} onChange={(e) => setTemplateType(e.target.value as any)} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="pkwt">PKWT</option>
                <option value="pkwtp">PKWTP</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium text-slate-700">No. Kontrak</div>
              <input value={form.contract_number} onChange={(e) => setForm((p) => ({ ...p, contract_number: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium text-slate-700">Nama Karyawan</div>
              <input value={form.employee_name} onChange={(e) => setForm((p) => ({ ...p, employee_name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="NIK" value={form.employee_nik} onChange={(e) => setForm((p) => ({ ...p, employee_nik: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
            <input placeholder="No Identitas" value={form.employee_identity_number} onChange={(e) => setForm((p) => ({ ...p, employee_identity_number: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
            <input placeholder="Jabatan" value={form.employee_position} onChange={(e) => setForm((p) => ({ ...p, employee_position: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Departemen" value={form.employee_department} onChange={(e) => setForm((p) => ({ ...p, employee_department: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
            <input placeholder="Alamat" value={form.employee_address} onChange={(e) => setForm((p) => ({ ...p, employee_address: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1"><div className="text-sm font-medium text-slate-700">Tanggal Mulai</div><input type="date" value={form.contract_start_date} onChange={(e) => setForm((p) => ({ ...p, contract_start_date: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" /></label>
            <label className="space-y-1"><div className="text-sm font-medium text-slate-700">Tanggal Selesai (opsional)</div><input type="date" value={form.contract_end_date} onChange={(e) => setForm((p) => ({ ...p, contract_end_date: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" /></label>
            <label className="space-y-1"><div className="text-sm font-medium text-slate-700">Bulan Percobaan (opsional)</div><input type="number" min={0} value={form.probation_months} onChange={(e) => setForm((p) => ({ ...p, probation_months: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" /></label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setForm({ contract_number: "", employee_name: "", employee_nik: "", employee_identity_number: "", employee_address: "", employee_position: "", employee_department: "", contract_start_date: "", contract_end_date: "", probation_months: "", probation_end_date: "" }); }} className="rounded-xl border border-slate-300 px-4 py-2">Reset</button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-green-500 px-4 py-2 text-white">{isSubmitting ? "Menyimpan..." : "Generate & Simpan"}</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Cari nama atau no kontrak..." className="w-full sm:max-w-md" />
            <button onClick={() => fetchHistory()} className="rounded-xl bg-slate-700 text-white px-3 py-2">Refresh</button>
          </div>

          <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
            <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">No. Kontrak</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tipe</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Jabatan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Mulai</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Selesai</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingHistory ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center">Memuat...</td></tr>
                ) : filtered.length > 0 ? (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-sm text-slate-900">{row.contract_number ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.employee_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.template_type?.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.employee_position ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.contract_start_date ? dateFormatter.format(new Date(row.contract_start_date)) : "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{row.contract_end_date ? dateFormatter.format(new Date(row.contract_end_date)) : (row.probation_end_date ? dateFormatter.format(new Date(row.probation_end_date)) : "-")}</td>
                      <td className="px-4 py-3 text-sm">
                        <RowActions>
                          <DetailButton onClick={async () => {
                            try {
                              const res = await apiFetch(`/api/hr/pkwt/${row.id}`);
                              const data = await res.json();
                              if (!res.ok) throw new Error(data?.message || "Gagal memuat preview.");
                              setPreviewContent(data.pkwt.generated_content ?? "");
                              setPreviewOpen(true);
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Gagal memuat preview.");
                            }
                          }} />
                          <DeleteButton onClick={() => openDelete(row.id)} />
                        </RowActions>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="px-4 py-8 text-center">Riwayat kontrak tidak ditemukan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={"Preview Kontrak"} maxWidth="max-w-3xl">
        <div className="space-y-3">
          <pre className="whitespace-pre-wrap text-sm text-slate-800 bg-white p-3 rounded-md border border-slate-100">{previewContent}</pre>
          <div className="flex justify-end gap-3">
            <button onClick={handleDownload} className="rounded-xl border px-4 py-2">Download TXT</button>
            <button onClick={handlePrint} className="rounded-xl bg-blue-600 text-white px-4 py-2">Print</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={isDeleteOpen} onClose={closeDelete} onConfirm={handleConfirmDelete} title="Hapus Riwayat Kontrak" description="Yakin ingin menghapus riwayat kontrak ini?" confirmText="Hapus" cancelText="Batal" variant="danger" />
    </div>
  );
}

