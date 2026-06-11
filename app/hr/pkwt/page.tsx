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

function ContractDocument({ content }: { content: string | null }) {
  if (!content) return null;

  try {
    const rawLines = content.split("\n");
    const pihak1Details: { key: string; val: string }[] = [];
    const pihak2Details: { key: string; val: string }[] = [];
    const signatures: { role: string; name: string }[] = [];
    const bodyElements: React.ReactNode[] = [];
    
    let dateText = "";
    let titleText = "";
    let docNumberText = "";
    let openingText = "";
    let closingText = "";
    
    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i].trim();
      if (!line) {
        i++;
        continue;
      }
      
      // Date line: e.g. "Nganjuk, 11 Juni 2026"
      if (i === 0 && line.includes(",")) {
        const parts = line.split(",");
        const datePart = parts.slice(1).join(",").trim();
        dateText = `Nganjuk, ${datePart}`;
        i++;
        continue;
      }
      
      // Title line
      if (line.includes("SURAT PERJANJIAN") || line.includes("PERJANJIAN KERJA")) {
        titleText = line;
        i++;
        continue;
      }
      
      // Number line
      if (line.startsWith("Nomor:")) {
        docNumberText = line;
        i++;
        continue;
      }
      
      // Opening
      if (line.startsWith("Pada hari ini") || line.startsWith("Bahwa pada hari ini")) {
        openingText = line;
        i++;
        continue;
      }
      
      // Parties details
      if (line === "PIHAK PERTAMA") {
        i++;
        while (i < rawLines.length) {
          const subLine = rawLines[i].trim();
          if (!subLine || subLine === "PIHAK KEDUA" || subLine.startsWith("Pasal") || subLine.startsWith("Demikian")) {
            break;
          }
          if (subLine.includes(":")) {
            const parts = subLine.split(":");
            const k = parts[0].trim();
            const v = parts.slice(1).join(":").trim();
            pihak1Details.push({ key: k, val: v });
          }
          i++;
        }
        continue;
      }
      
      if (line === "PIHAK KEDUA") {
        i++;
        while (i < rawLines.length) {
          const subLine = rawLines[i].trim();
          if (!subLine || subLine.startsWith("Pasal") || subLine.startsWith("Demikian") || subLine.startsWith("PIHAK PERTAMA")) {
            break;
          }
          if (subLine.includes(":")) {
            const parts = subLine.split(":");
            const k = parts[0].trim();
            const v = parts.slice(1).join(":").trim();
            pihak2Details.push({ key: k, val: v });
          }
          i++;
        }
        continue;
      }
      
      // Pasals
      if (line.startsWith("Pasal ")) {
        const pasalHeader = line;
        i++;
        let pasalBody = "";
        while (i < rawLines.length) {
          const subLine = rawLines[i].trim();
          if (!subLine) {
            i++;
            continue;
          }
          if (subLine.startsWith("Pasal ") || subLine.startsWith("Demikian") || subLine.startsWith("PIHAK PERTAMA") || subLine.startsWith("PIHAK KEDUA")) {
            break;
          }
          pasalBody += (pasalBody ? " " : "") + subLine;
          i++;
        }
        bodyElements.push(
          <div key={`pasal-${pasalHeader}`} className="my-4">
            <div className="text-center font-bold text-slate-900 mb-1">{pasalHeader}</div>
            <p className="text-justify leading-relaxed text-slate-800 text-sm indent-8">{pasalBody}</p>
          </div>
        );
        continue;
      }
      
      // Closing
      if (line.startsWith("Demikian perjanjian")) {
        closingText = line;
        i++;
        continue;
      }
      
      // Signatures
      if (line === "PIHAK PERTAMA," || line === "PIHAK PERTAMA") {
        i++;
        let name = "";
        if (i < rawLines.length) {
          name = rawLines[i].trim();
          i++;
        }
        signatures.push({ role: "PIHAK PERTAMA", name });
        continue;
      }
      
      if (line === "PIHAK KEDUA," || line === "PIHAK KEDUA") {
        i++;
        let name = "";
        if (i < rawLines.length) {
          name = rawLines[i].trim();
          i++;
        }
        signatures.push({ role: "PIHAK KEDUA", name });
        continue;
      }
      
      // Fallback normal line
      if (line) {
        bodyElements.push(
          <p key={`line-${i}`} className="text-justify leading-relaxed text-slate-800 text-sm my-2">{line}</p>
        );
      }
      i++;
    }

    return (
      <div className="bg-white text-slate-900 p-8 md:p-12 shadow-inner border border-slate-200 rounded-sm max-w-[21cm] mx-auto min-h-[29.7cm] flex flex-col justify-between font-serif text-sm lining-nums">
        <div>
          {/* Kop Surat (Letterhead) */}
          <div className="border-b-4 border-slate-950 pb-4 mb-6 text-center">
            <h1 className="text-xl font-bold tracking-wide uppercase text-slate-950 font-serif">PT DOA SURYO AGONG</h1>
            <p className="text-xs text-slate-700 mt-1 font-sans">
              Jl. Nglinggo, Gobang, Nglinggo, Kec. Gondang, Kabupaten Nganjuk, Jawa Timur 64451
            </p>
          </div>
          
          {/* Date */}
          {dateText && (
            <div className="text-right text-sm text-slate-800 mb-6">
              {dateText}
            </div>
          )}
          
          {/* Title & Doc Number */}
          {(titleText || docNumberText) && (
            <div className="text-center mb-6">
              {titleText && <h2 className="text-md font-bold uppercase underline text-slate-950">{titleText}</h2>}
              {docNumberText && <p className="text-sm text-slate-850 font-semibold mt-1">{docNumberText}</p>}
            </div>
          )}
          
          {/* Opening Statement */}
          {openingText && (
            <p className="text-justify leading-relaxed text-slate-800 mb-4">
              {openingText}
            </p>
          )}
          
          {/* Pihak Pertama */}
          {pihak1Details.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 mb-2">PIHAK PERTAMA</h3>
              <table className="w-full text-sm">
                <tbody>
                  {pihak1Details.map((detail, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="w-36 py-0.5 pr-2 text-slate-700">{detail.key}</td>
                      <td className="w-4 py-0.5 text-center text-slate-700">:</td>
                      <td className="py-0.5 pl-2 text-slate-900 font-medium">{detail.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pihak Kedua */}
          {pihak2Details.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 mb-2">PIHAK KEDUA</h3>
              <table className="w-full text-sm">
                <tbody>
                  {pihak2Details.map((detail, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="w-36 py-0.5 pr-2 text-slate-700">{detail.key}</td>
                      <td className="w-4 py-0.5 text-center text-slate-700">:</td>
                      <td className="py-0.5 pl-2 text-slate-900 font-medium">{detail.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pasals and other blocks */}
          <div className="space-y-4">
            {bodyElements}
          </div>
          
          {/* Closing Statement */}
          {closingText && (
            <p className="text-justify leading-relaxed text-slate-800 mt-6 mb-8">
              {closingText}
            </p>
          )}
        </div>
        
        {/* Signatures */}
        {signatures.length > 0 && (
          <div className="mt-12 grid grid-cols-2 gap-4 text-center text-sm">
            {signatures.map((sig, idx) => (
              <div key={idx} className="flex flex-col justify-between h-28">
                <div className="font-bold uppercase text-slate-900">{sig.role},</div>
                <div className="font-bold text-slate-900">{sig.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    console.error("Failed to parse contract styled view, falling back", err);
    return (
      <pre className="whitespace-pre-wrap text-sm text-slate-800 bg-white p-3 rounded-md border border-slate-100 font-serif">
        {content}
      </pre>
    );
  }
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
    const marginX = 54; // standard 0.75 in margin
    const maxTextWidth = pageWidth - (marginX * 2);
    let cursorY = 54;

    const rawLines = previewContent.split("\n");
    const pihak1Details: { key: string; val: string }[] = [];
    const pihak2Details: { key: string; val: string }[] = [];
    const signatures: { role: string; name: string }[] = [];
    
    let dateText = "";
    let titleText = "";
    let docNumberText = "";
    let openingText = "";
    let closingText = "";
    
    // Parse the lines
    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i].trim();
      if (!line) {
        i++;
        continue;
      }
      
      // Date line: e.g. "Nganjuk, 11 Juni 2026"
      if (i === 0 && line.includes(",")) {
        const parts = line.split(",");
        const datePart = parts.slice(1).join(",").trim();
        dateText = `Nganjuk, ${datePart}`;
        i++;
        continue;
      }
      
      // Title line
      if (line.includes("SURAT PERJANJIAN") || line.includes("PERJANJIAN KERJA")) {
        titleText = line;
        i++;
        continue;
      }
      
      // Number line
      if (line.startsWith("Nomor:")) {
        docNumberText = line;
        i++;
        continue;
      }
      
      // Opening
      if (line.startsWith("Pada hari ini") || line.startsWith("Bahwa pada hari ini")) {
        openingText = line;
        i++;
        continue;
      }
      
      // Parties details
      if (line === "PIHAK PERTAMA") {
        i++;
        while (i < rawLines.length) {
          const subLine = rawLines[i].trim();
          if (!subLine || subLine === "PIHAK KEDUA" || subLine.startsWith("Pasal") || subLine.startsWith("Demikian")) {
            break;
          }
          if (subLine.includes(":")) {
            const parts = subLine.split(":");
            const k = parts[0].trim();
            const v = parts.slice(1).join(":").trim();
            pihak1Details.push({ key: k, val: v });
          }
          i++;
        }
        continue;
      }
      
      if (line === "PIHAK KEDUA") {
        i++;
        while (i < rawLines.length) {
          const subLine = rawLines[i].trim();
          if (!subLine || subLine.startsWith("Pasal") || subLine.startsWith("Demikian") || subLine.startsWith("PIHAK PERTAMA")) {
            break;
          }
          if (subLine.includes(":")) {
            const parts = subLine.split(":");
            const k = parts[0].trim();
            const v = parts.slice(1).join(":").trim();
            pihak2Details.push({ key: k, val: v });
          }
          i++;
        }
        continue;
      }
      
      // Signatures
      if (line === "PIHAK PERTAMA," || line === "PIHAK PERTAMA") {
        i++;
        let name = "";
        if (i < rawLines.length) {
          name = rawLines[i].trim();
          i++;
        }
        signatures.push({ role: "PIHAK PERTAMA", name });
        continue;
      }
      
      if (line === "PIHAK KEDUA," || line === "PIHAK KEDUA") {
        i++;
        let name = "";
        if (i < rawLines.length) {
          name = rawLines[i].trim();
          i++;
        }
        signatures.push({ role: "PIHAK KEDUA", name });
        continue;
      }
      
      i++;
    }

    // Helper to check page break
    const checkPageBreak = (neededHeight: number) => {
      if (cursorY + neededHeight > pageHeight - 54) {
        doc.addPage();
        cursorY = 54;
      }
    };

    // Draw Letterhead (Kop Surat)
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("PT DOA SURYO AGONG", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 16;
    
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Jl. Nglinggo, Gobang, Nglinggo, Kec. Gondang, Kabupaten Nganjuk, Jawa Timur 64451", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 12;
    
    // Draw Single Thick Separator Line
    doc.setLineWidth(3);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 24;

    // Draw Date
    if (dateText) {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(dateText, pageWidth - marginX, cursorY, { align: "right" });
      cursorY += 24;
    }

    // Draw Title & Number
    if (titleText) {
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(titleText, pageWidth / 2, cursorY, { align: "center" });
      const titleWidth = doc.getTextWidth(titleText);
      doc.setLineWidth(1);
      doc.line((pageWidth - titleWidth) / 2, cursorY + 2, (pageWidth + titleWidth) / 2, cursorY + 2);
      cursorY += 16;
    }
    if (docNumberText) {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(docNumberText, pageWidth / 2, cursorY, { align: "center" });
      cursorY += 24;
    }

    // Draw Opening
    if (openingText) {
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      const splitOpening = doc.splitTextToSize(openingText, maxTextWidth) as string[];
      checkPageBreak(splitOpening.length * 16);
      for (const line of splitOpening) {
        doc.text(line, marginX, cursorY);
        cursorY += 16;
      }
      cursorY += 12;
    }

    // Draw Pihak Pertama Details
    if (pihak1Details.length > 0) {
      checkPageBreak(20 + pihak1Details.length * 16);
      doc.setFont("times", "bold");
      doc.text("PIHAK PERTAMA", marginX, cursorY);
      cursorY += 16;
      
      doc.setFont("times", "normal");
      for (const detail of pihak1Details) {
        doc.text(detail.key, marginX, cursorY);
        doc.text(":", marginX + 130, cursorY);
        
        const valWidth = maxTextWidth - 140;
        const splitVal = doc.splitTextToSize(detail.val, valWidth) as string[];
        for (let idx = 0; idx < splitVal.length; idx++) {
          doc.text(splitVal[idx], marginX + 140, cursorY);
          if (idx < splitVal.length - 1) {
            cursorY += 16;
            checkPageBreak(16);
          }
        }
        cursorY += 16;
        checkPageBreak(16);
      }
      cursorY += 10;
    }

    // Draw Pihak Kedua Details
    if (pihak2Details.length > 0) {
      checkPageBreak(20 + pihak2Details.length * 16);
      doc.setFont("times", "bold");
      doc.text("PIHAK KEDUA", marginX, cursorY);
      cursorY += 16;
      
      doc.setFont("times", "normal");
      for (const detail of pihak2Details) {
        doc.text(detail.key, marginX, cursorY);
        doc.text(":", marginX + 130, cursorY);
        
        const valWidth = maxTextWidth - 140;
        const splitVal = doc.splitTextToSize(detail.val, valWidth) as string[];
        for (let idx = 0; idx < splitVal.length; idx++) {
          doc.text(splitVal[idx], marginX + 140, cursorY);
          if (idx < splitVal.length - 1) {
            cursorY += 16;
            checkPageBreak(16);
          }
        }
        cursorY += 16;
        checkPageBreak(16);
      }
      cursorY += 12;
    }

    // Draw Pasals
    i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      if (line.startsWith("Pasal ")) {
        const pasalHeader = line;
        i++;
        let pasalBody = "";
        while (i < rawLines.length) {
          const subLine = rawLines[i].trim();
          if (!subLine) {
            i++;
            continue;
          }
          if (subLine.startsWith("Pasal ") || subLine.startsWith("Demikian") || subLine.startsWith("PIHAK PERTAMA") || subLine.startsWith("PIHAK KEDUA")) {
            break;
          }
          pasalBody += (pasalBody ? " " : "") + subLine;
          i++;
        }

        checkPageBreak(36);
        doc.setFont("times", "bold");
        doc.text(pasalHeader, pageWidth / 2, cursorY, { align: "center" });
        cursorY += 16;

        doc.setFont("times", "normal");
        const splitBody = doc.splitTextToSize(pasalBody, maxTextWidth) as string[];
        checkPageBreak(splitBody.length * 16);
        for (const bLine of splitBody) {
          doc.text(bLine, marginX, cursorY);
          cursorY += 16;
        }
        cursorY += 12;
        continue;
      }

      if (line.startsWith("Demikian perjanjian")) {
        closingText = line;
      }
      i++;
    }

    // Draw Closing
    if (closingText) {
      doc.setFont("times", "normal");
      const splitClosing = doc.splitTextToSize(closingText, maxTextWidth) as string[];
      checkPageBreak(splitClosing.length * 16);
      for (const line of splitClosing) {
        doc.text(line, marginX, cursorY);
        cursorY += 16;
      }
      cursorY += 24;
    }

    // Draw Signatures
    if (signatures.length > 0) {
      checkPageBreak(100);
      
      const sig1 = signatures.find(s => s.role === "PIHAK PERTAMA");
      const sig2 = signatures.find(s => s.role === "PIHAK KEDUA");
      
      const sigYStart = cursorY;
      
      if (sig1) {
        doc.setFont("times", "bold");
        doc.text("PIHAK PERTAMA,", marginX + 80, sigYStart, { align: "center" });
        doc.setFont("times", "bold");
        doc.text(sig1.name, marginX + 80, sigYStart + 80, { align: "center" });
      }
      
      if (sig2) {
        doc.setFont("times", "bold");
        doc.text("PIHAK KEDUA,", pageWidth - marginX - 80, sigYStart, { align: "center" });
        doc.setFont("times", "bold");
        doc.text(sig2.name, pageWidth - marginX - 80, sigYStart + 80, { align: "center" });
      }
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

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={"Preview Kontrak"} maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="max-h-[70vh] overflow-y-auto bg-slate-100 p-4 rounded-xl border border-slate-200">
            <ContractDocument content={previewContent} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleDownloadPdf} className="rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 font-medium">Download PDF</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={isDeleteOpen} onClose={closeDelete} onConfirm={handleConfirmDelete} title="Hapus Riwayat Kontrak" description="Yakin ingin menghapus riwayat kontrak ini?" confirmText="Hapus" cancelText="Batal" variant="danger" />
    </div>
  );
}

