"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PlusCircle, Receipt, Eye } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";
import { SearchBar } from "@/components/ui/search-bar";
import type { TInvoice } from "@/types/supabase";
import type { ApiSuccess } from "@/types/api";

type InvoiceListPayload = { invoices: TInvoice[]; meta: { total: number } };
type TVendor = { id: string; nama_vendor: string; kontak?: string };

type TPurchaseItem = {
  deskripsi: string;
  qty: number;
  harga: number;
  total: number;
};

type TParsedCatatan = {
  notes: string;
  items: TPurchaseItem[];
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function FinancePurchaseInvoicePage() {
  const [items, setItems] = useState<TInvoice[]>([]);
  const [vendors, setVendors] = useState<TVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editData, setEditData] = useState<TInvoice | null>(null);
  const [detailData, setDetailData] = useState<TInvoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [customVendorName, setCustomVendorName] = useState("");

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    jatuh_tempo: "",
    total_amount: "0",
    catatan: "",
    items: [] as TPurchaseItem[]
  });

  const fetchDependencies = async () => {
    setIsLoading(true);
    try {
      const [invRes, venRes] = await Promise.all([
        apiFetch("/api/finance/invoice?page=1&limit=500"),
        apiFetch("/api/core/vendors?page=1&limit=500")
      ]);
      const invPayload = await invRes.json() as ApiSuccess<InvoiceListPayload>;
      const venPayload = await venRes.json() as ApiSuccess<{ vendors: TVendor[] }>;
      if (invPayload.success) setItems(invPayload.data.invoices ?? []);
      if (venPayload.success) setVendors(venPayload.data.vendors ?? []);
    } catch (err) {
      alert("Gagal memuat data dependensi.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDefaultInvoiceId = (allInvoices: TInvoice[]) => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    
    // Filter purchase invoices from current month
    const currentMonthPurchases = allInvoices.filter(item => {
      if (!item.id_invoice.startsWith("PEMB-")) return false;
      const date = new Date(item.tanggal);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const count = currentMonthPurchases.length;
    const nnnnn = String(count + 1).padStart(5, "0");
    setInvoiceId(`PEMB-${mm}${yy}-${nnnnn}`);
  };

  useEffect(() => {
    void fetchDependencies();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      calculateDefaultInvoiceId(items);
    } else {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      setInvoiceId(`PEMB-${mm}${yy}-00001`);
    }
  }, [items]);

  const filteredItems = useMemo(() => {
    const purchaseInvoices = items.filter(item => (item.id_invoice || "").startsWith("PEMB-"));
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return purchaseInvoices;
    return purchaseInvoices.filter((item) => {
      const idInvoice = item.id_invoice ?? "";
      const pelanggan = item.pelanggan ?? "";
      const catatan = item.catatan ?? "";
      return (
        idInvoice.toLowerCase().includes(keyword) ||
        pelanggan.toLowerCase().includes(keyword) ||
        catatan.toLowerCase().includes(keyword)
      );
    });
  }, [items, searchTerm]);

  const resetForm = () => {
    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      jatuh_tempo: "",
      total_amount: "0",
      catatan: "",
      items: []
    });
    setSelectedVendorId("");
    setCustomVendorName("");
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    calculateDefaultInvoiceId(items);
    setIsFormModalOpen(true);
  };

  const parseCatatan = (catatanStr: string | null): TParsedCatatan => {
    if (!catatanStr) return { notes: "", items: [] };

    // Check if it uses our formatted plain text style
    if (catatanStr.includes("Item Pembelian:") && catatanStr.includes("Catatan:")) {
      try {
        const items: TPurchaseItem[] = [];
        let notes = "";

        // Split by "Catatan:" to separate items and notes
        const parts = catatanStr.split("Catatan:");
        if (parts.length > 1) {
          notes = parts[1].trim();
          if (notes === "-") notes = "";
        }

        // Parse the items block
        const itemsBlock = parts[0].replace("Item Pembelian:", "").trim();
        const lines = itemsBlock.split("\n").map(l => l.trim()).filter(Boolean);
        
        for (const line of lines) {
          // Line format: "1. laptop (1 x Rp 12000000 = Rp 12000000)"
          const match = line.match(/^\d+\.\s+(.+)\s+\((\d+)\s+x\s+Rp\s*(\d+)\s*=\s*Rp\s*(\d+)\)$/);
          if (match) {
            const deskripsi = match[1].trim();
            const qty = Number(match[2]) || 0;
            const harga = Number(match[3]) || 0;
            const total = Number(match[4]) || 0;
            items.push({ deskripsi, qty, harga, total });
          }
        }
        return { notes, items };
      } catch (e) {
        // Fallback to treat entire string as notes
      }
    }

    // Fallback for legacy JSON format
    try {
      const parsed = JSON.parse(catatanStr);
      if (parsed && typeof parsed === "object" && "items" in parsed) {
        return {
          notes: parsed.notes || "",
          items: parsed.items || []
        };
      }
    } catch {
      // Fallback
    }

    return { notes: catatanStr, items: [] };
  };

  const openEditModal = (item: TInvoice) => {
    setEditData(item);
    setInvoiceId(item.id_invoice);
    
    const parsed = parseCatatan(item.catatan);
    
    // Match vendor
    const existingVendor = vendors.find(v => v.nama_vendor === item.pelanggan);
    if (existingVendor) {
      setSelectedVendorId(existingVendor.id);
      setCustomVendorName("");
    } else {
      setSelectedVendorId("custom");
      setCustomVendorName(item.pelanggan);
    }

    setFormData({
      tanggal: item.tanggal,
      jatuh_tempo: item.jatuh_tempo ?? "",
      total_amount: String(item.total_amount),
      catatan: parsed.notes,
      items: parsed.items
    });
    setIsFormModalOpen(true);
  };

  const openDetailModal = (item: TInvoice) => {
    setDetailData(item);
    setIsDetailModalOpen(true);
  };

  const updateItemsAndTotal = (newItems: TPurchaseItem[]) => {
    const total = newItems.reduce((acc, it) => acc + it.total, 0);
    setFormData(prev => ({
      ...prev,
      items: newItems,
      total_amount: String(total)
    }));
  };

  const handleAddItemRow = () => {
    const newItems = [...formData.items, { deskripsi: "", qty: 1, harga: 0, total: 0 }];
    updateItemsAndTotal(newItems);
  };

  const handleItemRowChange = (idx: number, field: keyof TPurchaseItem, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[idx] };
    
    if (field === "deskripsi") {
      item.deskripsi = value;
    } else if (field === "qty") {
      item.qty = Math.max(Number(value) || 0, 0);
      item.total = item.qty * item.harga;
    } else if (field === "harga") {
      item.harga = Math.max(Number(value) || 0, 0);
      item.total = item.qty * item.harga;
    }
    
    newItems[idx] = item;
    updateItemsAndTotal(newItems);
  };

  const handleRemoveItemRow = (idx: number) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    updateItemsAndTotal(newItems);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Determine Vendor Name
      let vendorName = "";
      if (selectedVendorId === "custom") {
        vendorName = customVendorName.trim();
      } else {
        const found = vendors.find(v => v.id === selectedVendorId);
        vendorName = found ? found.nama_vendor : "";
      }

      if (!vendorName) {
        throw new Error("Vendor / Supplier wajib dipilih atau diisi.");
      }

      // Serialize notes and items into plain text for human-readability in the database
      let serializedCatatan = "";
      if (formData.items.length > 0) {
        const formattedItems = formData.items
          .map((it, idx) => `${idx + 1}. ${it.deskripsi} (${it.qty} x Rp ${it.harga} = Rp ${it.total})`)
          .join("\n");
        serializedCatatan = `Item Pembelian:\n${formattedItems}\n\nCatatan: ${formData.catatan.trim() || "-"}`;
      } else {
        serializedCatatan = formData.catatan.trim() || "-";
      }

      const payload = {
        pelanggan: vendorName, // We reuse 'pelanggan' field for vendor name
        tanggal: formData.tanggal,
        jatuh_tempo: formData.jatuh_tempo || null,
        total_amount: Number(formData.total_amount),
        catatan: serializedCatatan,
        items: [], // We don't link to sales schema t_invoice_item
        ...(editData ? {} : { id_invoice: invoiceId })
      };

      const url = editData ? `/api/finance/invoice/${editData.id_invoice}` : "/api/finance/invoice";
      const method = editData ? "PATCH" : "POST";
      
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || "Gagal menyimpan");
      
      await fetchDependencies();
      setIsFormModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/finance/invoice/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchDependencies();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full">
      <section className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-green-500" /> Invoice Pembelian
          </h1>
          <p className="text-slate-300">Kelola invoice masuk dari vendor / supplier.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-white font-semibold hover:bg-green-600 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 active:scale-95 transition-all">
          <PlusCircle className="h-5 w-5" /> Buat Invoice Pembelian
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-200">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari ID, vendor, catatan..."
            className="w-full sm:max-w-md"
          />
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">ID</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Vendor / Supplier</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-500">Memuat...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-500">Belum ada invoice pembelian</td></tr>
              ) : filteredItems.map(item => (
                <tr key={item.id_invoice} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500" title={item.id_invoice}>{item.id_invoice}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(item.tanggal)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.pelanggan}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatRupiah(item.total_amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActions>
                      <DetailButton onClick={() => openDetailModal(item)} />
                      <EditButton onClick={() => openEditModal(item)} />
                      <DeleteButton onClick={() => setDeleteId(item.id_invoice)} />
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editData ? "Edit Invoice Pembelian" : "Buat Invoice Pembelian"} maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID Invoice</label>
              <input
                readOnly
                value={editData?.id_invoice ?? invoiceId}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600 font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor / Supplier</label>
              <select
                required
                value={selectedVendorId}
                onChange={e => {
                  setSelectedVendorId(e.target.value);
                  if (e.target.value !== "custom") setCustomVendorName("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              >
                <option value="" disabled>-- Pilih Vendor --</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.nama_vendor}</option>
                ))}
                <option value="custom">-- Tulis Manual / Lainnya --</option>
              </select>
            </div>

            {selectedVendorId === "custom" && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama Vendor Baru</label>
                <input
                  required
                  value={customVendorName}
                  onChange={e => setCustomVendorName(e.target.value)}
                  placeholder="Masukkan nama vendor..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Invoice</label>
              <input type="date" required value={formData.tanggal} onChange={e => setFormData(f => ({...f, tanggal: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jatuh Tempo</label>
              <input type="date" required value={formData.jatuh_tempo} onChange={e => setFormData(f => ({...f, jatuh_tempo: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Nominal</label>
              <input
                type="text"
                readOnly
                value={formatRupiah(Number(formData.total_amount))}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-700 font-bold text-slate-800"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan Tambahan</label>
              <input value={formData.catatan} onChange={e => setFormData(f => ({...f, catatan: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20" placeholder="Keterangan lainnya..." />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-semibold text-slate-900">Item Pembelian</p>
              <button type="button" onClick={handleAddItemRow} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-700 active:scale-95 transition-all">Tambah Item</button>
            </div>
            {formData.items.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 border rounded-xl border-dashed border-slate-300 bg-slate-50">Belum ada item ditambahkan.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {formData.items.map((it, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end border p-3 rounded-xl bg-slate-50/50">
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Item</label>
                      <input
                        required
                        value={it.deskripsi}
                        onChange={e => handleItemRowChange(idx, "deskripsi", e.target.value)}
                        placeholder="Contoh: Pembayaran bahan baku / ATK..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-300"
                      />
                    </div>
                    <div className="w-full sm:w-20 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={it.qty}
                        onChange={e => handleItemRowChange(idx, "qty", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 text-center focus:outline-none focus:border-slate-300"
                      />
                    </div>
                    <div className="w-full sm:w-36 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Harga Satuan</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={it.harga}
                        onChange={e => handleItemRowChange(idx, "harga", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-300"
                      />
                    </div>
                    <div className="w-full sm:w-36 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Total</label>
                      <input
                        type="text"
                        readOnly
                        value={formatRupiah(it.total)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600 font-semibold"
                      />
                    </div>
                    <button type="button" onClick={() => handleRemoveItemRow(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                      <DeleteButton onClick={() => {}} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button type="button" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Invoice Pembelian" maxWidth="max-w-2xl">
        {detailData && (() => {
          const parsed = parseCatatan(detailData.catatan);
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><p className="text-slate-500 text-xs font-semibold uppercase">ID Invoice</p><p className="font-mono mt-1 text-slate-800 font-semibold">{detailData.id_invoice}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase">Vendor / Supplier</p><p className="mt-1 font-semibold text-slate-800">{detailData.pelanggan}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase">Tanggal</p><p className="mt-1 text-slate-800">{formatDate(detailData.tanggal)}</p></div>
                <div><p className="text-slate-500 text-xs font-semibold uppercase">Jatuh Tempo</p><p className="mt-1 text-slate-800">{detailData.jatuh_tempo ? formatDate(detailData.jatuh_tempo) : "-"}</p></div>
                <div className="col-span-2"><p className="text-slate-500 text-xs font-semibold uppercase">Total Nominal</p><p className="mt-1 text-lg font-bold text-green-600">{formatRupiah(detailData.total_amount)}</p></div>
                <div className="col-span-2"><p className="text-slate-500 text-xs font-semibold uppercase">Catatan Tambahan</p><p className="mt-1 text-slate-800">{parsed.notes || "-"}</p></div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Item Pembelian</p>
                {parsed.items.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-2">Tidak ada item tercatat.</p>
                ) : (
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-slate-600">Deskripsi</th>
                          <th className="px-4 py-2 font-semibold text-slate-600 text-center w-16">Qty</th>
                          <th className="px-4 py-2 font-semibold text-slate-600 text-right w-28">Harga Satuan</th>
                          <th className="px-4 py-2 font-semibold text-slate-600 text-right w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsed.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-medium text-slate-800">{it.deskripsi}</td>
                            <td className="px-4 py-2.5 text-center text-slate-600">{it.qty}</td>
                            <td className="px-4 py-2.5 text-right text-slate-600">{formatRupiah(it.harga)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatRupiah(it.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all">Tutup</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleConfirmDelete} title="Hapus Invoice Pembelian" description="Yakin hapus invoice pembelian ini?" variant="danger" />
    </div>
  );
}
