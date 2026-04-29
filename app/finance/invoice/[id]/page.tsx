"use client";

import { FormEvent, useEffect, useState } from "react";
import { PlusCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";
import type { TInvoiceItem } from "@/types/supabase";
import type { ApiSuccess } from "@/types/api";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default function FinanceInvoiceItemsPage() {
  const params = useParams();
  const invoiceId = params?.id as string;
  const [items, setItems] = useState<TInvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TInvoiceItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id_sales_order: "", deskripsi: ""
  });

  const fetchItems = async () => {
    if (!invoiceId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/finance/invoice-items?invoice_id=${invoiceId}`);
      const payload = await res.json() as ApiSuccess<{invoice_items: TInvoiceItem[]}>;
      if (payload.success) setItems(payload.data.invoice_items ?? []);
    } catch (err) {
      alert("Gagal memuat data item invoice.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void fetchItems(); }, [invoiceId]);

  const resetForm = () => {
    setFormData({ id_sales_order: "", deskripsi: "" });
    setEditData(null);
  };

  const openAddModal = () => { resetForm(); setIsFormModalOpen(true); };
  const openEditModal = (item: TInvoiceItem) => {
    setEditData(item);
    setFormData({
      id_sales_order: item.id_sales_order, deskripsi: item.deskripsi ?? ""
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData, id_invoice: invoiceId,
      };

      // Kita tidak membuat endpoint PATCH terpisah karena primary key adalah composite.
      // Cukup gunakan POST. Jika ingin mengizinkan edit, user harus delete lalu tambah.
      const url = "/api/finance/invoice-items";
      const method = "POST";
      
      const res = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || "Gagal menyimpan");
      
      await fetchItems();
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
      const res = await apiFetch(`/api/finance/invoice-items?id_invoice=${invoiceId}&id_sales_order=${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchItems();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full">
      <section className="flex flex-col sm:flex-row justify-between gap-3 items-center">
        <div className="flex items-center gap-3">
          <Link href="/finance/invoice" className="p-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Detail Item Invoice</h1>
            <p className="text-slate-300">Kelola baris item pada invoice ini.</p>
          </div>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700">
          <PlusCircle className="h-5 w-5" /> Tambah Item
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">ID Sales Order</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Deskripsi</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={3} className="text-center py-6 text-slate-500">Memuat...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-6 text-slate-500">Belum ada item</td></tr>
              ) : items.map((item, idx) => (
                <tr key={`${item.id_invoice}-${item.id_sales_order}-${idx}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm text-slate-700">{item.id_sales_order}</td>
                  <td className="px-4 py-3 text-slate-600">{item.deskripsi || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActions>
                      <DeleteButton onClick={() => setDeleteId(item.id_sales_order)} />
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editData ? "Edit Item" : "Tambah Item"} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">ID Sales Order</label>
            <input required value={formData.id_sales_order} onChange={e => setFormData(f => ({...f, id_sales_order: e.target.value}))} className="w-full border p-2 rounded-lg" placeholder="Masukkan UUID Sales Order" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Deskripsi (Opsional)</label>
            <textarea value={formData.deskripsi} onChange={e => setFormData(f => ({...f, deskripsi: e.target.value}))} className="w-full border p-2 rounded-lg h-20" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 border rounded-lg">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleConfirmDelete} title="Hapus Item" description="Yakin hapus item ini?" variant="danger" />
    </div>
  );
}
