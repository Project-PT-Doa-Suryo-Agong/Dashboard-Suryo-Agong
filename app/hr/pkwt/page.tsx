"use client";
import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { apiFetch } from "@/lib/utils/api-fetch";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, DetailButton, DeleteButton } from "@/components/ui/RowActions";
import { FileText, PlusCircle } from "lucide-react";
import type { TPKWT } from "@/types/supabase";
import { jsPDF } from "jspdf";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });

type EmployeeOption = {
  id: string;
  nama: string;
  nik: string;
  nip: string;
  posisi: string;
  divisi: string;
  alamat_domisili: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: { message?: string; details?: unknown };
  data?: T;
};

function getErrorMessage(payload: ApiEnvelope<unknown>, fallback: string) {
  return payload?.error?.message || payload?.message || fallback;
}

export default function PKWTPage() {
  const [tab, setTab] = useState<"generate" | "history">("generate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Form state
  const [templateType, setTemplateType] = useState<"pkwt" | "pkwtp">("pkwt");
  const [form, setForm] = useState<Record<string, any>>({
    employee_id: "",
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

  useEffect(() => {
    void fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setIsLoadingEmployees(true);
    try {
      const res = await apiFetch("/api/hr/employees?page=1&limit=500", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error?.message || "Gagal mengambil data karyawan.");
      }

      const rows = Array.isArray(payload?.data?.karyawan) ? payload.data.karyawan : [];
      const normalized: EmployeeOption[] = rows
        .map((item: Record<string, unknown>) => {
          const id = typeof item.id === "string" ? item.id : "";
          const nama = typeof item.nama === "string" ? item.nama : "";
          if (!id || !nama) return null;

          return {
            id,
            nama,
            nik: typeof item.nik === "string" ? item.nik : "",
            nip: typeof item.nip === "string" ? item.nip : "",
            posisi: typeof item.posisi === "string" ? item.posisi : "",
            divisi: typeof item.divisi === "string" ? item.divisi : "",
            alamat_domisili: typeof item.alamat_domisili === "string" ? item.alamat_domisili : "",
          } as EmployeeOption;
        })
        .filter(Boolean) as EmployeeOption[];

      setEmployees(normalized);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal mengambil daftar karyawan.");
    } finally {
      setIsLoadingEmployees(false);
    }
  }

  const applySelectedEmployee = (employeeId: string) => {
    const selected = employees.find((employee) => employee.id === employeeId);
    setForm((prev) => ({
      ...prev,
      employee_id: selected?.id ?? "",
      employee_name: selected?.nama ?? "",
      employee_nik: selected?.nik ?? "",
      employee_identity_number: selected?.nip ?? "",
      employee_position: selected?.posisi ?? "",
      employee_department: selected?.divisi ?? "",
      employee_address: selected?.alamat_domisili ?? "",
    }));
  };

  async function fetchHistory() {
    setIsLoadingHistory(true);
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : "";
      const res = await apiFetch(`/api/hr/pkwt?page=${page}&limit=50${q}`);
      const payload = (await res.json()) as ApiEnvelope<{ pkwt?: TPKWT[] }>;
      if (!res.ok || !payload?.success) throw new Error(getErrorMessage(payload, "Gagal mengambil riwayat."));
      setHistory(payload?.data?.pkwt ?? []);
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
    if (!form.employee_id || !form.contract_start_date) {
      alert("Karyawan dan tanggal mulai kontrak wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        templateType,
        employee: { ...form },
      };

      const res = await apiFetch(`/api/hr/pkwt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const responsePayload = (await res.json()) as ApiEnvelope<{ pkwt?: TPKWT; draft?: { content?: string } }>;
      if (!res.ok || !responsePayload?.success) {
        const errorDetails = responsePayload?.error?.details as { missingFields?: unknown } | undefined;
        const missingFields = errorDetails?.missingFields;
        if (Array.isArray(missingFields)) {
          alert("Informasi karyawan belum lengkap: " + missingFields.join(", "));
        } else {
          throw new Error(getErrorMessage(responsePayload, "Gagal generate kontrak."));
        }
        return;
      }

      const generated = responsePayload?.data?.pkwt as TPKWT | undefined;
      if (generated) {
        setPreviewContent(generated.generated_content ?? "");
        setPreviewOpen(true);
      } else if (responsePayload?.data?.draft?.content) {
        setPreviewContent(responsePayload.data.draft.content ?? "");
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

  const handleDownloadPdf = () => {
    if (!previewContent) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const marginY = 44;
    const lineHeight = 18;
    const maxTextWidth = pageWidth - (marginX * 2);

    doc.setFont("courier", "normal");
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(previewContent, maxTextWidth) as string[];
    let cursorY = marginY;

    for (const line of lines) {
      if (cursorY > pageHeight - marginY) {
        doc.addPage();
        cursorY = marginY;
      }
      doc.text(line, marginX, cursorY);
      cursorY += lineHeight;
    }

    const safeName = (form.employee_name ?? "kontrak")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-") || "kontrak";

    doc.save(`${safeName}-${templateType}.pdf`);
  };

  const openDelete = (id: string) => { setDeleteId(id); setIsDeleteOpen(true); };
  const closeDelete = () => { setDeleteId(null); setIsDeleteOpen(false); };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiFetch(`/api/hr/pkwt/${deleteId}`, { method: "DELETE" });
      const payload = (await res.json()) as ApiEnvelope<null>;
      if (!res.ok || !payload?.success) throw new Error(getErrorMessage(payload, "Gagal menghapus riwayat."));
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
              <select
                value={form.employee_id}
                onChange={(e) => applySelectedEmployee(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                disabled={isLoadingEmployees}
              >
                <option value="">{isLoadingEmployees ? "Memuat karyawan..." : "Pilih karyawan"}</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.nama}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="NIK" value={form.employee_nik} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            <input placeholder="No Identitas (NIP)" value={form.employee_identity_number} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            <input placeholder="Jabatan" value={form.employee_position} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Departemen" value={form.employee_department} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
            <input placeholder="Alamat" value={form.employee_address} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1"><div className="text-sm font-medium text-slate-700">Tanggal Mulai</div><input type="date" value={form.contract_start_date} onChange={(e) => setForm((p) => ({ ...p, contract_start_date: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" /></label>
            <label className="space-y-1"><div className="text-sm font-medium text-slate-700">Tanggal Selesai (opsional)</div><input type="date" value={form.contract_end_date} onChange={(e) => setForm((p) => ({ ...p, contract_end_date: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" /></label>
            <label className="space-y-1"><div className="text-sm font-medium text-slate-700">Bulan Percobaan (opsional)</div><input type="number" min={0} value={form.probation_months} onChange={(e) => setForm((p) => ({ ...p, probation_months: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" /></label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setForm({
                  employee_id: "",
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
              }}
              className="rounded-xl border border-slate-300 px-4 py-2"
            >
              Reset
            </button>
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
                              const payload = (await res.json()) as ApiEnvelope<{ pkwt?: TPKWT }>;
                              if (!res.ok || !payload?.success) throw new Error(getErrorMessage(payload, "Gagal memuat preview."));
                              setPreviewContent(payload?.data?.pkwt?.generated_content ?? "");
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
            <button onClick={handleDownloadPdf} className="rounded-xl bg-blue-600 text-white px-4 py-2">Download PDF</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={isDeleteOpen} onClose={closeDelete} onConfirm={handleConfirmDelete} title="Hapus Riwayat Kontrak" description="Yakin ingin menghapus riwayat kontrak ini?" confirmText="Hapus" cancelText="Batal" variant="danger" />
    </div>
  );
}

