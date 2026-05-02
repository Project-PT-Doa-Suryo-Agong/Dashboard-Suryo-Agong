"use client";

import { FormEvent, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";
import type { TInvoice, TInvoiceItem, TSalesOrder, MVarian } from "@/types/supabase";
import type { ApiSuccess } from "@/types/api";

type InvoiceListPayload = { invoices: TInvoice[]; meta: { total: number } };

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function FinanceInvoicePage() {
  const [items, setItems] = useState<TInvoice[]>([]);
  const [salesOrders, setSalesOrders] = useState<TSalesOrder[]>([]);
  const [variants, setVariants] = useState<MVarian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editData, setEditData] = useState<TInvoice | null>(null);
  const [detailData, setDetailData] = useState<{ invoice: TInvoice, items: TInvoiceItem[] } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState("");

  const [formData, setFormData] = useState({
    pelanggan: "",
    tanggal: new Date().toISOString().split("T")[0], jatuh_tempo: "",
    total_amount: "0", catatan: "",
    items: [] as { id_sales_order: string; deskripsi: string }[]
  });

  const fetchDependencies = async () => {
    setIsLoading(true);
    try {
      const [invRes, soRes, varRes] = await Promise.all([
        apiFetch("/api/finance/invoice?page=1&limit=500"),
        apiFetch("/api/sales/orders?page=1&limit=500"),
        apiFetch("/api/core/variants")
      ]);
      const invPayload = await invRes.json() as ApiSuccess<InvoiceListPayload>;
      const soPayload = await soRes.json() as ApiSuccess<{ orders: TSalesOrder[] }>;
      const varPayload = await varRes.json() as ApiSuccess<{ varian: MVarian[] }>;
      if (invPayload.success) setItems(invPayload.data.invoices ?? []);
      if (soPayload.success) setSalesOrders(soPayload.data.orders ?? []);
      if (varPayload.success) setVariants(varPayload.data.varian ?? []);
    } catch (err) {
      alert("Gagal memuat data dependensi.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefaultInvoiceId = async () => {
    try {
      const res = await apiFetch("/api/finance/invoice-number");
      const payload = await res.json() as ApiSuccess<{ count: number }>;
      if (payload.success) {
        const count = payload.data.count ?? 0;
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yy = String(now.getFullYear()).slice(-2);
        const nnnnn = String(count + 1).padStart(5, "0");
        setInvoiceId(`INVC-${mm}${yy}-${nnnnn}`);
      }
    } catch {
      setInvoiceId("");
    }
  };

  useEffect(() => {
    void fetchDependencies();
    void fetchDefaultInvoiceId();
  }, []);

  const resetForm = () => {
    setFormData({
      pelanggan: "",
      tanggal: new Date().toISOString().split("T")[0], jatuh_tempo: "",
      total_amount: "0", catatan: "",
      items: []
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    void fetchDefaultInvoiceId();
    setIsFormModalOpen(true);
  };
  const openEditModal = async (item: TInvoice) => {
    setEditData(item);
    setInvoiceId(item.id_invoice);
    setFormData({
      pelanggan: item.pelanggan,
      tanggal: item.tanggal, jatuh_tempo: item.jatuh_tempo ?? "",
      total_amount: String(item.total_amount),
      catatan: item.catatan ?? "",
      items: []
    });
    setIsFormModalOpen(true);
    try {
      const res = await apiFetch(`/api/finance/invoice-items?invoice_id=${item.id_invoice}`);
      const payload = await res.json() as ApiSuccess<{invoice_items: TInvoiceItem[]}>;
      if (payload.success) {
        setFormData(prev => ({ ...prev, items: payload.data.invoice_items.map(i => ({ id_sales_order: i.id_sales_order, deskripsi: i.deskripsi ?? "" })) }));
      }
    } catch (e) { console.error("Failed to fetch items", e); }
  };

  const openDetailModal = async (item: TInvoice) => {
    try {
      const res = await apiFetch(`/api/finance/invoice-items?invoice_id=${item.id_invoice}`);
      const payload = await res.json() as ApiSuccess<{invoice_items: TInvoiceItem[]}>;
      setDetailData({ invoice: item, items: payload.success ? payload.data.invoice_items : [] });
      setIsDetailModalOpen(true);
    } catch (e) { console.error("Failed to fetch detail items", e); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        total_amount: Number(formData.total_amount),
        jatuh_tempo: formData.jatuh_tempo || null,
        ...(editData ? {} : { id_invoice: invoiceId || undefined })
      };

      const url = editData ? `/api/finance/invoice/${editData.id_invoice}` : "/api/finance/invoice";
      const method = editData ? "PATCH" : "POST";
      
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || "Gagal menyimpan");
      
      await fetchDependencies();
      if (!editData) {
        await fetchDefaultInvoiceId();
      }
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
          <h1 className="text-2xl font-bold text-slate-100">Invoices</h1>
          <p className="text-slate-300">Kelola tagihan pelanggan.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-white font-semibold hover:bg-green-600">
          <PlusCircle className="h-5 w-5" /> Buat Invoice
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">ID</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Klien</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-500">Memuat...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-500">Belum ada invoice</td></tr>
              ) : items.map(item => (
                <tr key={item.id_invoice} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500" title={item.id_invoice}>{item.id_invoice}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(item.tanggal)}</td>
                  <td className="px-4 py-3 text-slate-800">{item.pelanggan}</td>
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

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editData ? "Edit Invoice" : "Buat Invoice"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID Invoice</label>
              <input
                readOnly
                value={editData?.id_invoice ?? invoiceId}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Klien / Pelanggan</label>
              <input required value={formData.pelanggan} onChange={e => setFormData(f => ({...f, pelanggan: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Nominal</label>
              <input type="number" required value={formData.total_amount} onChange={e => setFormData(f => ({...f, total_amount: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal</label>
              <input type="date" required value={formData.tanggal} onChange={e => setFormData(f => ({...f, tanggal: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jatuh Tempo</label>
              <input type="date" value={formData.jatuh_tempo} onChange={e => setFormData(f => ({...f, jatuh_tempo: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Catatan</label>
              <input value={formData.catatan} onChange={e => setFormData(f => ({...f, catatan: e.target.value}))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-semibold text-slate-900">Item Invoice (Sales Orders)</p>
              <button type="button" onClick={() => setFormData(f => ({...f, items: [...f.items, { id_sales_order: "", deskripsi: "" }] }))} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-700">Tambah Item</button>
            </div>
            {formData.items.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 border rounded-xl border-dashed">Belum ada item ditambahkan.</p>
            ) : (
              <div className="space-y-3">
                {formData.items.map((it, idx) => (
                  <div key={idx} className="flex gap-3 items-start border p-3 rounded-xl bg-slate-50">
                    <div className="flex-1 space-y-2">
                      <select 
                        required 
                        value={it.id_sales_order} 
                        onChange={e => {
                          const soId = e.target.value;
                          const so = salesOrders.find(s => s.id === soId);
                          let deskripsi = it.deskripsi;
                          if (so) {
                            const variant = variants.find(v => v.id === so.varian_id);
                            deskripsi = variant?.nama_varian || "Varian tidak ditemukan";
                          }
                          setFormData(f => { 
                            const newIt = [...f.items]; 
                            newIt[idx] = { id_sales_order: soId, deskripsi };
                            
                            // Calculate new total nominal
                            let sum = 0;
                            newIt.forEach(item => {
                              const order = salesOrders.find(s => s.id === item.id_sales_order);
                              if (order && order.total_price) sum += order.total_price;
                            });
                            
                            return {...f, items: newIt, total_amount: String(sum)}; 
                          });
                        }} 
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B]"
                      >
                        <option value="" disabled>-- Pilih Sales Order --</option>
                        {salesOrders.map(so => (
                          <option key={so.id} value={so.id}>
                            {so.order_code || so.id.substring(0, 8)} - {formatRupiah(so.total_price || 0)}
                          </option>
                        ))}
                      </select>
                      <input value={it.deskripsi} readOnly onChange={e => setFormData(f => { const newIt = [...f.items]; newIt[idx].deskripsi = e.target.value; return {...f, items: newIt}; })} placeholder="Deskripsi Otomatis (Varian)" className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 focus:outline-none" />
                    </div>
                    <button type="button" onClick={() => setFormData(f => {
                      const newIt = f.items.filter((_, i) => i !== idx);
                      let sum = 0;
                      newIt.forEach(item => {
                        const order = salesOrders.find(s => s.id === item.id_sales_order);
                        if (order && order.total_price) sum += order.total_price;
                      });
                      return {...f, items: newIt, total_amount: String(sum)};
                    })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Invoice" maxWidth="max-w-2xl">
        {detailData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><p className="text-slate-500 text-xs font-semibold uppercase">ID Invoice</p><p className="font-mono mt-1 text-slate-800">{detailData.invoice.id_invoice}</p></div>
              <div><p className="text-slate-500 text-xs font-semibold uppercase">Klien</p><p className="mt-1 font-semibold text-slate-800">{detailData.invoice.pelanggan}</p></div>
              <div><p className="text-slate-500 text-xs font-semibold uppercase">Tanggal</p><p className="mt-1 text-slate-800">{formatDate(detailData.invoice.tanggal)}</p></div>
              <div><p className="text-slate-500 text-xs font-semibold uppercase">Jatuh Tempo</p><p className="mt-1 text-slate-800">{detailData.invoice.jatuh_tempo ? formatDate(detailData.invoice.jatuh_tempo) : "-"}</p></div>
              <div><p className="text-slate-500 text-xs font-semibold uppercase">Total Nominal</p><p className="mt-1 text-slate-800 font-bold text-[#BC934B]">{formatRupiah(detailData.invoice.total_amount)}</p></div>
              <div><p className="text-slate-500 text-xs font-semibold uppercase">Catatan</p><p className="mt-1 text-slate-800">{detailData.invoice.catatan || "-"}</p></div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">Item Terkait (Sales Orders)</p>
              {detailData.items.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Tidak ada item tercatat.</p>
              ) : (
                <div className="space-y-3">
                  {detailData.items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase">ID Sales Order</p>
                      <p className="font-mono text-sm text-blue-600 mb-2">{it.id_sales_order}</p>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Deskripsi</p>
                      <p className="text-sm text-slate-700">{it.deskripsi || "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700">Tutup</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleConfirmDelete} title="Hapus Invoice" description="Yakin hapus invoice ini?" variant="danger" />
    </div>
  );
}
