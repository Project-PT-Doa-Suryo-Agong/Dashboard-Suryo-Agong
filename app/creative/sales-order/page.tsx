"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Plus, ShoppingBag, Trash2, Download, Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MCOA, MVarian, TSalesOrder, TMembership } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type TSalesOrderWithCoa = TSalesOrder & {
  m_coa?: { kode_akun: string; nama_akun: string } | null;
};
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";

type SalesOrderListPayload = {
  orders: TSalesOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type SalesOrderPayload = {
  order: TSalesOrder | null;
};

type VarianListPayload = {
  varian: MVarian[];
};

type CoaListPayload = {
  coa: MCOA[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type MembershipListPayload = {
  membership: TMembership[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type FormItem = {
  varian_id: string;
  quantity: string;
};

type FormState = {
  order_number: string;
  varian_id: string;
  coa_cash_id: string | null;
  coa_credit_id: string | null;
  quantity: string;
  total_price: string;
  nama_pelanggan: string;
  nomor_telepon: string;
  lokasi: string;
  terms_of_payment: string;
  diskon: string;
  jumlah_cash: string;
  jumlah_piutang: string;
  total_bayar: string;
  total_item: string;
  items: FormItem[];
};

const initialFormState: FormState = {
  order_number: "",
  varian_id: "",
  coa_cash_id: null,
  coa_credit_id: null,
  quantity: "",
  total_price: "",
  nama_pelanggan: "",
  nomor_telepon: "",
  lokasi: "",
  terms_of_payment: "0",
  diskon: "0",
  jumlah_cash: "",
  jumlah_piutang: "0",
  total_bayar: "",
  total_item: "",
  items: [{ varian_id: "", quantity: "1" }],
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const raw = await response.text();
  let payload: ApiSuccess<T> | ApiError;
  try {
    payload = JSON.parse(raw) as ApiSuccess<T> | ApiError;
  } catch {
    const fallback = response.ok ? "Respons server tidak valid (bukan JSON)." : raw.slice(0, 200);
    throw new Error(fallback || "Respons server tidak valid.");
  }
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getOrderDisplayCode(order: { order_number?: string | null; id?: string | null } | null | undefined): string {
  return order?.order_number?.trim() || order?.id || "-";
}

function getVarianLabel(item: MVarian): string {
  const nama = item.nama_varian ?? "Varian tanpa nama";
  const sku = item.sku ? `SKU: ${item.sku}` : "SKU: -";
  const harga = item.harga ? formatRupiah(item.harga) : "Harga: -";
  return `${nama} (${sku}) - ${harga}`;
}

function normalizeCoaName(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

function findCoaByExactName(coaList: MCOA[], name: string): MCOA | undefined {
  const target = normalizeCoaName(name);
  return coaList.find((coa) => normalizeCoaName(coa.nama_akun) === target);
}

function findCoaByNameContains(coaList: MCOA[], keyword: string): MCOA | undefined {
  const target = normalizeCoaName(keyword);
  return coaList.find((coa) => normalizeCoaName(coa.nama_akun).includes(target));
}

function getOrderQuantity(order: Pick<TSalesOrder, "quantity" | "total_item"> & { items?: Array<{ qty?: number | string }> } | null | undefined): number {
  if (!order) return 0;

  if (Array.isArray(order.items) && order.items.length > 0) {
    const itemQty = order.items.reduce((total, item) => total + Number(item.qty ?? 0), 0);
    if (itemQty > 0) return itemQty;
  }

  const totalItem = Number(order.total_item ?? 0);
  if (totalItem > 0) return totalItem;

  return Number(order.quantity ?? 0);
}

export default function SalesOrderPage() {
  const [orders, setOrders] = useState<TSalesOrderWithCoa[]>([]);
  const [variants, setVariants] = useState<MVarian[]>([]);
  const [coaOptions, setCoaOptions] = useState<MCOA[]>([]);
  const [memberships, setMemberships] = useState<TMembership[]>([]);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<TSalesOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<TSalesOrderWithCoa | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Import Excel states
  const [isImporting, setIsImporting] = useState(false);
  const [isImportResultOpen, setIsImportResultOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    summary: { total: number; success: number; error: number };
    details: { row: number; status: string; message: string; order_number?: string }[];
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const variantMap = useMemo(
    () => new Map<string, MVarian>(variants.map((item) => [item.id, item])),
    [variants],
  );

  const resolveCalculatedTotal = useCallback(
    (variantId: string, quantity: string) => {
      const qty = Number(quantity);
      if (!variantId || Number.isNaN(qty) || qty <= 0) return "";

      const variant = variantMap.get(variantId);
      if (!variant || variant.harga == null) return "";

      return String(variant.harga * qty);
    },
    [variantMap],
  );

  const handleVariantChange = (variantId: string) => {
    setFormData((prev) => ({
      ...prev,
      varian_id: variantId,
    }));
  };

  const handleQuantityChange = (quantity: string) => {
    setFormData((prev) => ({
      ...prev,
      quantity,
    }));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: string) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = {
        ...nextItems[index],
        [field]: value
      };
      return {
        ...prev,
        items: nextItems
      };
    });
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { varian_id: "", quantity: "1" }]
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev) => {
      if (prev.items.length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, idx) => idx !== index)
      };
    });
  };

  useEffect(() => {
    setFormData((prev) => {
      let totalProductPrice = 0;
      let totalProductQty = 0;

      if (prev.items && prev.items.length > 0) {
        prev.items.forEach((item) => {
          const itemPrice = Number(resolveCalculatedTotal(item.varian_id, item.quantity) || 0);
          totalProductPrice += itemPrice;
          totalProductQty += Number(item.quantity || 0);
        });
      } else {
        totalProductPrice = Number(resolveCalculatedTotal(prev.varian_id, prev.quantity) || 0);
        totalProductQty = Number(prev.quantity || 0);
      }

      const parsedTotal = totalProductPrice;
      const parsedDiskon = Number(prev.diskon || 0);
      const nextTotalBayar = Math.max(0, parsedTotal - parsedDiskon);

      const isTopZero = Number(prev.terms_of_payment || 0) === 0;
      const rawCash = Number(prev.jumlah_cash !== "" ? prev.jumlah_cash : nextTotalBayar);
      const cappedCash = Math.min(rawCash, nextTotalBayar);
      const parsedCash = isTopZero ? nextTotalBayar : cappedCash;
      const nextPiutang = isTopZero ? 0 : Math.max(0, nextTotalBayar - parsedCash);

      // Set fallback values for single varian legacy fields
      const fallbackVarianId = prev.items && prev.items.length > 0 ? prev.items[0].varian_id : prev.varian_id;
      const fallbackQuantity = prev.items && prev.items.length > 0 ? String(totalProductQty) : prev.quantity;

      if (
        prev.total_price === String(parsedTotal) && 
        prev.total_bayar === String(nextTotalBayar) && 
        prev.jumlah_piutang === String(nextPiutang) &&
        prev.total_item === String(totalProductQty) &&
        prev.varian_id === fallbackVarianId &&
        prev.quantity === fallbackQuantity &&
        (prev.jumlah_cash !== "" || String(parsedCash) === prev.jumlah_cash)
      ) {
        return prev;
      }

      return {
        ...prev,
        varian_id: fallbackVarianId,
        quantity: fallbackQuantity,
        total_price: String(parsedTotal),
        total_item: String(totalProductQty),
        total_bayar: String(nextTotalBayar),
        jumlah_cash: isTopZero ? String(parsedCash) : (prev.jumlah_cash === "" ? String(parsedCash) : String(cappedCash)),
        jumlah_piutang: String(nextPiutang),
      };
    });
  }, [formData.items, formData.varian_id, formData.quantity, formData.diskon, formData.jumlah_cash, formData.terms_of_payment, resolveCalculatedTotal]);

  const coaMap = useMemo(
    () => new Map<string, MCOA>(coaOptions.map((item) => [item.id, item])),
    [coaOptions],
  );

  const bankOptionsMeta = useMemo(() => {
    const cashParent = findCoaByExactName(coaOptions, "Kas Penjualan");
    const creditParent = findCoaByExactName(coaOptions, "Piutang Usaha");

    const cashBanks = cashParent ? coaOptions.filter((coa) => coa.parent_id === cashParent.id) : [];
    const creditBanks = creditParent ? coaOptions.filter((coa) => coa.parent_id === creditParent.id) : [];

    const preferredCash =
      findCoaByNameContains(cashBanks, "Bank BCA") ??
      findCoaByNameContains(cashBanks, "BCA") ??
      cashBanks[0];

    const preferredCredit =
      findCoaByNameContains(creditBanks, "Bank Dummy") ??
      findCoaByNameContains(creditBanks, "Dummy") ??
      creditBanks[0];

    return {
      cashBanks,
      creditBanks,
      preferredCashId: preferredCash?.id ?? null,
      preferredCreditId: preferredCredit?.id ?? null,
    };
  }, [coaOptions]);

  const isCreditPayment = Number(formData.terms_of_payment || 0) > 0;
  const cashBankOptions = bankOptionsMeta.cashBanks;
  const creditBankOptions = bankOptionsMeta.creditBanks;

  useEffect(() => {
    if (cashBankOptions.length === 0 && creditBankOptions.length === 0) return;

    setFormData((prev) => {
      let next = prev;
      let changed = false;

      if (!prev.coa_cash_id || !cashBankOptions.some((item) => item.id === prev.coa_cash_id)) {
        next = {
          ...next,
          coa_cash_id: bankOptionsMeta.preferredCashId ?? cashBankOptions[0]?.id ?? null,
        };
        changed = true;
      }

      if (isCreditPayment) {
        if (!prev.coa_credit_id || !creditBankOptions.some((item) => item.id === prev.coa_credit_id)) {
          next = {
            ...next,
            coa_credit_id: bankOptionsMeta.preferredCreditId ?? creditBankOptions[0]?.id ?? null,
          };
          changed = true;
        }
      } else if (prev.coa_credit_id !== null) {
        next = {
          ...next,
          coa_credit_id: null,
        };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [cashBankOptions, creditBankOptions, bankOptionsMeta.preferredCashId, bankOptionsMeta.preferredCreditId, isCreditPayment]);

  const resetForm = () => {
    setFormData({
      ...initialFormState,
      coa_cash_id: bankOptionsMeta.preferredCashId ?? cashBankOptions[0]?.id ?? null,
      coa_credit_id: null,
    });
    setEditData(null);
    void fetchDefaultOrderNumber();
  };

  const fetchDefaultOrderNumber = useCallback(async () => {
    try {
      const response = await apiFetch("/api/sales/order-number", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<{ count: number }>(response);
      const count = payload.data.count;
      
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const nnnnn = String(count + 1).padStart(5, '0');
      
      setFormData((prev) => ({
        ...prev,
        order_number: `ORD-${mm}${yy}-${nnnnn}`,
      }));
    } catch (error) {
      console.error("Gagal mengambil order number:", error);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    const [ordersResponse, variantsResponse, coaResponse, membershipResponse] = await Promise.all([
      apiFetch("/api/sales/orders?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
      apiFetch("/api/core/variants", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
      apiFetch("/api/finance/coa?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
      apiFetch("/api/sales/membership?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
    ]);

    const ordersPayload = await parseJsonResponse<SalesOrderListPayload>(ordersResponse);
    const varianPayload = await parseJsonResponse<VarianListPayload>(variantsResponse);
    const coaPayload = await parseJsonResponse<CoaListPayload>(coaResponse);
    const membershipPayload = await parseJsonResponse<MembershipListPayload>(membershipResponse);

    setOrders(ordersPayload.data.orders ?? []);
    setVariants(varianPayload.data.varian ?? []);
    setCoaOptions(coaPayload.data.coa ?? []);
    setMemberships(membershipPayload.data.membership ?? []);
  }, []);

  const fetchOrdersAndDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDependencies();
      await fetchDefaultOrderNumber();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data sales order.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDependencies, fetchDefaultOrderNumber]);

  useEffect(() => {
    void fetchOrdersAndDependencies();
  }, [fetchOrdersAndDependencies]);

  const openEditModal = (item: TSalesOrder) => {
    setEditData(item);
    const initialQuantity = String(item.quantity);
    const initialVariantId = item.varian_id ?? "";
    
    // Extract enriched items array
    const enrichedItems = (item as any).items && Array.isArray((item as any).items) && (item as any).items.length > 0
      ? (item as any).items.map((it: any) => ({
          varian_id: it.id_varian ?? "",
          quantity: String(it.qty ?? 1)
        }))
      : [{ varian_id: initialVariantId, quantity: initialQuantity }];

    setFormData({
      order_number: item.order_number ?? "",
      varian_id: initialVariantId,
      coa_cash_id: (item as any).coa_cash_id ?? null,
      coa_credit_id: (item as any).coa_credit_id ?? null,
      quantity: initialQuantity,
      total_price: String(item.total_price),
      nama_pelanggan: item.nama_pelanggan ?? "",
      nomor_telepon: item.nomor_telepon ?? "",
      lokasi: item.lokasi ?? "",
      terms_of_payment: String(item.terms_of_payment ?? 0),
      diskon: String(item.diskon ?? 0),
      jumlah_cash: String(item.jumlah_cash ?? (item.total_price || 0)),
      jumlah_piutang: String(item.jumlah_piutang ?? 0),
      total_bayar: String(item.total_bayar ?? (item.total_price || 0)),
      total_item: String(item.total_item ?? initialQuantity),
      items: enrichedItems
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetForm();
  };

  const openDetailModal = (item: TSalesOrderWithCoa) => {
    setDetailData(item);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailData(null);
    setIsDetailModalOpen(false);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedQuantity = Number(formData.total_item || formData.quantity);
    const parsedTotalPrice = Number(formData.total_price);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      alert("Total quantity harus lebih dari 0.");
      return;
    }
    if (Number.isNaN(parsedTotalPrice) || parsedTotalPrice < 0) {
      alert("Total price harus angka valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_number: formData.order_number || undefined,
          coa_cash_id: formData.coa_cash_id || null,
          coa_credit_id: formData.coa_credit_id || null,
          nama_pelanggan: formData.nama_pelanggan || null,
          nomor_telepon: formData.nomor_telepon || null,
          lokasi: formData.lokasi || null,
          terms_of_payment: Number(formData.terms_of_payment || 0),
          diskon: Number(formData.diskon || 0),
          jumlah_cash: Number(formData.jumlah_cash || parsedTotalPrice),
          jumlah_piutang: Number(formData.jumlah_piutang || 0),
          total_bayar: Number(formData.total_bayar || parsedTotalPrice),
          total_item: Number(formData.total_item || parsedQuantity),
          items: formData.items.map(it => ({
            varian_id: it.varian_id,
            quantity: Number(it.quantity)
          }))
        }),
      });
      await parseJsonResponse<SalesOrderPayload>(response);
      await fetchOrdersAndDependencies();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat sales order.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editData || isSubmitting) return;

    const parsedQuantity = Number(formData.total_item || formData.quantity);
    const parsedTotalPrice = Number(formData.total_price);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      alert("Total quantity harus lebih dari 0.");
      return;
    }
    if (Number.isNaN(parsedTotalPrice) || parsedTotalPrice < 0) {
      alert("Total price harus angka valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/sales/orders/${editData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coa_cash_id: formData.coa_cash_id || null,
          coa_credit_id: formData.coa_credit_id || null,
          nama_pelanggan: formData.nama_pelanggan || null,
          nomor_telepon: formData.nomor_telepon || null,
          lokasi: formData.lokasi || null,
          terms_of_payment: Number(formData.terms_of_payment || 0),
          diskon: Number(formData.diskon || 0),
          jumlah_cash: Number(formData.jumlah_cash || parsedTotalPrice),
          jumlah_piutang: Number(formData.jumlah_piutang || 0),
          total_bayar: Number(formData.total_bayar || parsedTotalPrice),
          total_item: Number(formData.total_item || parsedQuantity),
          items: formData.items.map(it => ({
            varian_id: it.varian_id,
            quantity: Number(it.quantity)
          }))
        }),
      });
      await parseJsonResponse<SalesOrderPayload>(response);
      await fetchOrdersAndDependencies();
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal update sales order.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/sales/orders/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchOrdersAndDependencies();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus sales order.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  // ── Import Excel handlers ────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const response = await apiFetch("/api/sales/orders/template", {
        method: "GET",
      });
      if (!response.ok) {
        alert("Gagal mengunduh template.");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_sales_order.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Gagal mengunduh template.");
    }
  };

  const handleImportExcel = async (file: File) => {
    if (isImporting) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      alert("File harus berformat .xlsx atau .xls");
      return;
    }

    setIsImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const response = await apiFetch("/api/sales/orders/import", {
        method: "POST",
        body: fd,
      });

      const raw = await response.text();
      let payload: any;
      try {
        payload = JSON.parse(raw);
      } catch {
        alert("Respons server tidak valid.");
        return;
      }

      if (!response.ok || !payload.success) {
        alert(payload?.error?.message || "Gagal mengimpor file.");
        return;
      }

      setImportResult(payload.data);
      setIsImportResultOpen(true);
      await fetchOrdersAndDependencies();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengimpor file.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleImportExcel(file);
      event.target.value = ""; // Reset input
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleImportExcel(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="text-slate-500 w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-800">Sales Management</h2>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Number</label>
            <input
              type="text"
              readOnly
              value={formData.order_number}
              className="w-full bg-slate-100 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm cursor-not-allowed font-mono font-bold"
              placeholder="Auto-generated"
              disabled
            />
          </div>

          <div className="space-y-2 lg:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Member</label>
                <select
                  value=""
                  onChange={(event) => {
                    const memberId = event.target.value;
                    if (!memberId) return;
                    const member = memberships.find((m) => m.id === memberId);
                    if (member) {
                      setFormData((prev) => ({
                        ...prev,
                        nama_pelanggan: member.nama ?? "",
                        nomor_telepon: member.telepon ?? "",
                        lokasi: member.lokasi ?? "",
                      }));
                    }
                  }}
                  className="w-full bg-amber-50 border text-slate-700 border-amber-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400"
                  disabled={isSubmitting}
                >
                  <option value="">-- Pilih dari Member (opsional) --</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama ?? "Tanpa Nama"} {m.telepon ? `(${m.telepon})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Pelanggan</label>
                <input
                  type="text"
                  value={formData.nama_pelanggan}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nama_pelanggan: event.target.value }))}
                  className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nama Pelanggan"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.nomor_telepon}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nomor_telepon: event.target.value }))}
                  className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nomor Telepon"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Lokasi</label>
                <input
                  type="text"
                  value={formData.lokasi}
                  onChange={(event) => setFormData((prev) => ({ ...prev, lokasi: event.target.value }))}
                  className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Lokasi"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>



          {/* DYNAMIC VARIANT/ITEM SECTION */}
          <div className="space-y-4 lg:col-span-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">Daftar Item / Varian Produk</h4>
              <button
                type="button"
                onClick={addItemRow}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-750 active:bg-blue-800 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-100"
              >
                + Tambah Item
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.items.map((it, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-end gap-4 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Varian Produk</label>
                    <select
                      required
                      value={it.varian_id}
                      onChange={(event) => handleItemChange(idx, "varian_id", event.target.value)}
                      className="w-full bg-slate-50 border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>-- Pilih Produk Varian --</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {getVarianLabel(v)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-full md:w-32 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qty</label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(event) => handleItemChange(idx, "quantity", event.target.value)}
                      className="w-full bg-slate-50 border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="1"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="w-full md:w-44 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtotal</label>
                    <input
                      type="text"
                      readOnly
                      value={formatRupiah(Number(resolveCalculatedTotal(it.varian_id, it.quantity) || 0))}
                      className="w-full bg-slate-100 border text-slate-500 border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold cursor-not-allowed"
                      disabled
                    />
                  </div>

                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={isSubmitting}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold p-2 rounded-lg text-sm transition-all flex items-center justify-center border border-red-200 h-9 w-9"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4 border-t border-slate-100 pt-4">
            <h4 className="text-sm font-bold text-slate-700">Detail Pembayaran & Transaksi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
              {/* Row 1: Summary */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Harga Barang</label>
                <input
                  type="text"
                  value={formatRupiah(Number(formData.total_price))}
                  readOnly
                  className="w-full bg-slate-150 border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm cursor-not-allowed font-bold"
                  placeholder="0"
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diskon (IDR)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.diskon}
                  onChange={(event) => setFormData((prev) => ({ ...prev, diskon: event.target.value }))}
                  className="w-full bg-white border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Bayar</label>
                <input
                  type="text"
                  value={formatRupiah(Number(formData.total_bayar))}
                  readOnly
                  className="w-full bg-slate-150 border border-slate-200 rounded-lg py-2 px-3 text-sm cursor-not-allowed font-bold text-green-600"
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Terms of Payment (Hari)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.terms_of_payment}
                  onChange={(event) => setFormData((prev) => ({ ...prev, terms_of_payment: event.target.value }))}
                  className="w-full bg-white border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>

              {/* Row 2: Bank Cash (selalu tampil) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank Cash</label>
                <select
                  value={formData.coa_cash_id ?? ""}
                  onChange={(event) => setFormData((prev) => ({ ...prev, coa_cash_id: event.target.value || null }))}
                  className="w-full rounded-lg border border-slate-200 bg-white text-slate-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
                  disabled={isSubmitting || cashBankOptions.length === 0}
                >
                  <option value="" disabled>
                    {cashBankOptions.length === 0 ? "Bank cash tidak tersedia" : "-- Pilih Bank Cash --"}
                  </option>
                  {cashBankOptions.map((coa) => (
                    <option key={coa.id} value={coa.id}>
                      {coa.kode_akun} - {coa.nama_akun}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Hybrid Payment (TOP > 0) — Cash + Kredit */}
              {isCreditPayment && (
                <>
                  <div className="lg:col-span-4 border-t border-dashed border-slate-200 my-1" />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Jumlah Cash (Bayar)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.jumlah_cash}
                      onChange={(event) => {
                        const value = event.target.value;
                        const totalBayar = Number(formData.total_bayar || 0);
                        const parsed = value === "" ? "" : String(Math.min(Number(value || 0), totalBayar));
                        setFormData((prev) => ({ ...prev, jumlah_cash: parsed }));
                      }}
                      className="w-full bg-white border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="0"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Jumlah Piutang (Kredit)</label>
                    <input
                      type="text"
                      value={formatRupiah(Number(formData.jumlah_piutang))}
                      readOnly
                      className="w-full bg-slate-150 border text-slate-600 border-slate-200 rounded-lg py-2 px-3 text-sm cursor-not-allowed font-bold"
                      disabled
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank Kredit</label>
                    <select
                      value={formData.coa_credit_id ?? ""}
                      onChange={(event) => setFormData((prev) => ({ ...prev, coa_credit_id: event.target.value || null }))}
                      className="w-full rounded-lg border border-slate-200 bg-white text-slate-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-100 disabled:cursor-not-allowed"
                      disabled={isSubmitting || creditBankOptions.length === 0}
                    >
                      <option value="" disabled>
                        {creditBankOptions.length === 0 ? "Bank kredit tidak tersedia" : "-- Pilih Bank Kredit --"}
                      </option>
                      {creditBankOptions.map((coa) => (
                        <option key={coa.id} value={coa.id}>
                          {coa.kode_akun} - {coa.nama_akun}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              {isSubmitting ? "Menyimpan..." : "Submit Order"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Import Excel Section ───────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Import Sales Order dari Excel</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload file Excel (.xlsx) untuk menambah sales order secara bulk</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-200 hover:border-slate-300 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
            <label
              htmlFor="import-excel-input"
              className={`flex items-center gap-2 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm ${
                isImporting
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
              }`}
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Mengimpor..." : "Import Excel"}
              <input
                id="import-excel-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={isImporting}
              />
            </label>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragOver
              ? "border-emerald-400 bg-emerald-50/60"
              : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
          }`}
        >
          {isImporting ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Memproses file Excel...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className={`w-8 h-8 ${ isDragOver ? "text-emerald-500" : "text-slate-300" }`} />
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-600">Drag & drop</span> file Excel di sini, atau klik tombol Import Excel di atas
              </p>
              <p className="text-xs text-slate-400">Format: .xlsx atau .xls</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-slate-800 font-bold">Sales Order History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Order Code</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Product Variant</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Total Price</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Order Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    Belum ada sales order.
                  </td>
                </tr>
              ) : (
                orders.map((item) => {
                  const orderItems = (item as any).items || [];

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">{getOrderDisplayCode(item)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {orderItems.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {orderItems.map((it: any, idx: number) => {
                              const v = variantMap.get(it.id_varian);
                              return (
                                <span key={idx} className="text-xs bg-slate-100 text-slate-750 px-2 py-0.5 rounded-md w-fit font-semibold border border-slate-200">
                                  {v?.nama_varian ?? "Produk"} ({it.qty}x)
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span>
                            {item.varian_id && variantMap.get(item.varian_id)
                              ? `${variantMap.get(item.varian_id)?.nama_varian} (${item.quantity}x)`
                              : "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 text-center font-bold">
                        {getOrderQuantity(item)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatRupiah(item.total_price)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 text-right">{formatDate(item.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <RowActions>
                          <DetailButton onClick={() => openDetailModal(item)} disabled={isSubmitting} />
                          <EditButton onClick={() => openEditModal(item)} disabled={isSubmitting} />
                          <DeleteButton onClick={() => openDeleteModal(item.id)} disabled={isSubmitting} />
                        </RowActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isEditModalOpen && editData && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          maxWidth="max-w-3xl"
          title="Edit Sales Order"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Member</label>
                <select
                  value=""
                  onChange={(event) => {
                    const memberId = event.target.value;
                    if (!memberId) return;
                    const member = memberships.find((m) => m.id === memberId);
                    if (member) {
                      setFormData((prev) => ({
                        ...prev,
                        nama_pelanggan: member.nama ?? "",
                        nomor_telepon: member.telepon ?? "",
                        lokasi: member.lokasi ?? "",
                      }));
                    }
                  }}
                  className="w-full bg-amber-50 border text-slate-700 border-amber-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400"
                  disabled={isSubmitting}
                >
                  <option value="">-- Pilih dari Member (opsional) --</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama ?? "Tanpa Nama"} {m.telepon ? `(${m.telepon})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Pelanggan</label>
                <input
                  type="text"
                  value={formData.nama_pelanggan}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nama_pelanggan: event.target.value }))}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nama Pelanggan"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.nomor_telepon}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nomor_telepon: event.target.value }))}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nomor Telepon"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Lokasi</label>
                <input
                  type="text"
                  value={formData.lokasi}
                  onChange={(event) => setFormData((prev) => ({ ...prev, lokasi: event.target.value }))}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Lokasi"
                  disabled={isSubmitting}
                />
              </div>


            </div>

            {/* DYNAMIC EDIT VARIANT/ITEM SECTION */}
            <div className="space-y-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Daftar Item / Varian Produk</h4>
                <button
                  type="button"
                  onClick={addItemRow}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-750 active:bg-blue-800 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-100"
                >
                  + Tambah Item
                </button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {formData.items.map((it, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-end gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Varian Produk</label>
                      <select
                        required
                        value={it.varian_id}
                        onChange={(event) => handleItemChange(idx, "varian_id", event.target.value)}
                        className="w-full bg-slate-50 border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        disabled={isSubmitting}
                      >
                        <option value="" disabled>-- Pilih Produk Varian --</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {getVarianLabel(v)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-full sm:w-20 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qty</label>
                      <input
                        required
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(event) => handleItemChange(idx, "quantity", event.target.value)}
                        className="w-full bg-slate-50 border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        placeholder="1"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="w-full sm:w-36 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtotal</label>
                      <input
                        type="text"
                        readOnly
                        value={formatRupiah(Number(resolveCalculatedTotal(it.varian_id, it.quantity) || 0))}
                        className="w-full bg-slate-100 border text-slate-500 border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold cursor-not-allowed"
                        disabled
                      />
                    </div>

                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={isSubmitting}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold p-2 rounded-lg text-sm transition-all flex items-center justify-center border border-red-200 h-9 w-9"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <h5 className="text-xs font-bold text-slate-750">Detail Pembayaran & Transaksi</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                {/* Summary */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Total Harga Barang</label>
                  <input
                    type="text"
                    value={formatRupiah(Number(formData.total_price))}
                    readOnly
                    className="w-full bg-slate-150 border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm cursor-not-allowed font-bold"
                    placeholder="0"
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Diskon (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.diskon}
                    onChange={(event) => setFormData((prev) => ({ ...prev, diskon: event.target.value }))}
                    className="w-full bg-white border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Total Bayar</label>
                  <input
                    type="text"
                    value={formatRupiah(Number(formData.total_bayar))}
                    readOnly
                    className="w-full bg-slate-150 border border-slate-200 rounded-lg py-2 px-3 text-sm cursor-not-allowed font-bold text-green-600"
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Terms of Payment (Hari)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.terms_of_payment}
                    onChange={(event) => setFormData((prev) => ({ ...prev, terms_of_payment: event.target.value }))}
                    className="w-full bg-white border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Bank Cash (selalu tampil) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Bank Cash</label>
                  <select
                    value={formData.coa_cash_id ?? ""}
                    onChange={(event) => setFormData((prev) => ({ ...prev, coa_cash_id: event.target.value || null }))}
                    className="w-full rounded-lg border border-slate-200 bg-white text-slate-700 py-2 px-3 text-sm focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    disabled={isSubmitting || cashBankOptions.length === 0}
                  >
                    <option value="" disabled>
                      {cashBankOptions.length === 0 ? "Bank cash tidak tersedia" : "-- Pilih Bank Cash --"}
                    </option>
                    {cashBankOptions.map((coa) => (
                      <option key={coa.id} value={coa.id}>
                        {coa.kode_akun} - {coa.nama_akun}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hybrid Payment (TOP > 0) — Cash + Kredit */}
                {isCreditPayment && (
                  <>
                    <div className="sm:col-span-2 border-t border-dashed border-slate-200 my-1" />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Jumlah Cash (Bayar)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.jumlah_cash}
                        onChange={(event) => {
                          const value = event.target.value;
                          const totalBayar = Number(formData.total_bayar || 0);
                          const parsed = value === "" ? "" : String(Math.min(Number(value || 0), totalBayar));
                          setFormData((prev) => ({ ...prev, jumlah_cash: parsed }));
                        }}
                        className="w-full bg-white border text-slate-700 border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        placeholder="0"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Jumlah Piutang (Kredit)</label>
                      <input
                        type="text"
                        value={formatRupiah(Number(formData.jumlah_piutang))}
                        readOnly
                        className="w-full bg-slate-150 border text-slate-600 border-slate-200 rounded-lg py-2 px-3 text-sm cursor-not-allowed font-bold"
                        disabled
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-semibold">Bank Kredit</label>
                      <select
                        value={formData.coa_credit_id ?? ""}
                        onChange={(event) => setFormData((prev) => ({ ...prev, coa_credit_id: event.target.value || null }))}
                        className="w-full rounded-lg border border-slate-200 bg-white text-slate-700 py-2 px-3 text-sm focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                        disabled={isSubmitting || creditBankOptions.length === 0}
                      >
                        <option value="" disabled>
                          {creditBankOptions.length === 0 ? "Bank kredit tidak tersedia" : "-- Pilih Bank Kredit --"}
                        </option>
                        {creditBankOptions.map((coa) => (
                          <option key={coa.id} value={coa.id}>
                            {coa.kode_akun} - {coa.nama_akun}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Sales Order"
        description="Apakah Anda yakin ingin menghapus sales order ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {isDetailModalOpen && detailData && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          maxWidth="max-w-xl"
          title={
            <div>
              <h3 className="text-lg font-bold text-slate-900">Detail Sales Order</h3>
              <p className="mt-1 text-sm text-slate-500">Informasi lengkap pesanan afiliasi.</p>
            </div>
          }
        >
          <div className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Order Code</label>
              <p className="mt-1 text-sm text-slate-800 font-medium font-mono">{getOrderDisplayCode(detailData)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Nama Pelanggan</label>
                <p className="mt-1 text-sm text-slate-800 font-medium">{detailData.nama_pelanggan || "-"}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Nomor Telepon</label>
                <p className="mt-1 text-sm text-slate-800 font-medium">{detailData.nomor_telepon || "-"}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Lokasi</label>
              <p className="mt-1 text-sm text-slate-800 font-medium">{detailData.lokasi || "-"}</p>
            </div>

            {/* PRODUCT ITEMS DETAIL TABLE */}
            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Item Detail / Varian</label>
              <div className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="px-3 py-2">Varian</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Harga</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 text-slate-700 font-medium">
                    {((detailData as any).items && Array.isArray((detailData as any).items) && (detailData as any).items.length > 0) ? (
                      (detailData as any).items.map((it: any, idx: number) => {
                        const v = variantMap.get(it.id_varian);
                        return (
                          <tr key={idx} className="hover:bg-slate-100/50">
                            <td className="px-3 py-2">{v?.nama_varian ?? "Produk"}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-800">{it.qty}</td>
                            <td className="px-3 py-2 text-right">{formatRupiah(it.harga)}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">{formatRupiah(it.harga_total)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-3 py-2">{variantMap.get(detailData.varian_id ?? "")?.nama_varian ?? "-"}</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-800">{getOrderQuantity(detailData)}</td>
                        <td className="px-3 py-2 text-right">
                          {formatRupiah(Number(detailData.total_price || 0) / Math.max(1, getOrderQuantity(detailData)))}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">{formatRupiah(Number(detailData.total_price || 0))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">COA Cash</label>
              <p className="mt-1 text-sm text-slate-800 font-medium">
                {(detailData as any).coa_cash_id && coaMap.get((detailData as any).coa_cash_id)
                  ? `${coaMap.get((detailData as any).coa_cash_id)?.kode_akun} - ${coaMap.get((detailData as any).coa_cash_id)?.nama_akun}`
                  : "-"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">COA Credit</label>
              <p className="mt-1 text-sm text-slate-800 font-medium">
                {(detailData as any).coa_credit_id && coaMap.get((detailData as any).coa_credit_id)
                  ? `${coaMap.get((detailData as any).coa_credit_id)?.kode_akun} - ${coaMap.get((detailData as any).coa_credit_id)?.nama_akun}`
                  : "-"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Terms of Payment</label>
                <p className="mt-1 text-sm text-slate-800 font-medium">{detailData.terms_of_payment ?? 0} Hari</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Diskon</label>
                <p className="mt-1 text-sm text-red-650 font-bold">{formatRupiah(detailData.diskon ?? 0)}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Jumlah Cash</label>
                <p className="mt-1 text-sm text-slate-800 font-bold text-green-600">{formatRupiah(detailData.jumlah_cash ?? (detailData.total_price || 0))}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Jumlah Piutang</label>
                <p className="mt-1 text-sm text-amber-600 font-bold">{formatRupiah(detailData.jumlah_piutang ?? 0)}</p>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Total Bayar</label>
                <p className="mt-1 text-base text-slate-900 font-bold text-green-600">
                  {formatRupiah(detailData.total_bayar ?? (detailData.total_price || 0))}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Quantity</label>
                <p className="mt-1 text-sm text-slate-800 font-bold">{getOrderQuantity(detailData)}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Total Price</label>
                <p className="mt-1 text-sm text-slate-900 font-bold">{formatRupiah(detailData.total_price)}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Order Date</label>
              <p className="mt-1 text-sm text-slate-500">
                {formatDate(detailData.created_at)}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={closeDetailModal}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Import Result Modal ─────────────────────────────────────────── */}
      {isImportResultOpen && importResult && (
        <Modal
          isOpen={isImportResultOpen}
          onClose={() => { setIsImportResultOpen(false); setImportResult(null); }}
          maxWidth="max-w-2xl"
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hasil Import Excel</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ringkasan proses import sales order dari file Excel</p>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-2xl font-bold text-slate-800">{importResult.summary.total}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Baris</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-2xl font-bold text-emerald-600">{importResult.summary.success}</p>
                <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mt-1">Berhasil</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                <p className="text-2xl font-bold text-red-600">{importResult.summary.error}</p>
                <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mt-1">Gagal</p>
              </div>
            </div>

            {/* Detail List */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="px-3 py-2">Baris</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {importResult.details.map((detail, idx) => (
                    <tr key={idx} className={`transition-colors ${
                      detail.status === "success" ? "bg-white" : "bg-red-50/50"
                    }`}>
                      <td className="px-3 py-2 font-bold text-slate-700">#{detail.row}</td>
                      <td className="px-3 py-2">
                        {detail.status === "success" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Berhasil
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Gagal
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {detail.status === "success" && detail.order_number
                          ? <span className="font-mono text-emerald-700 font-semibold">{detail.order_number}</span>
                          : detail.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => { setIsImportResultOpen(false); setImportResult(null); }}
                className="inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}