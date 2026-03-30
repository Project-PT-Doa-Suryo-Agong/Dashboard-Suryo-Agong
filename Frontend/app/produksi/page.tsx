"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckSquare,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";

type OrderStatus = "draft" | "ongoing" | "done";
type QcResultStatus = "pass" | "reject";

type OrderSummary = {
  id: string;
  product_name: string;
  target_qty: number;
  status: OrderStatus;
  start_date: string;
};

type QcSummary = {
  id: string;
  reference_id: string;
  product_name: string;
  qty: number;
  status: QcResultStatus;
  date: string;
};

const production_t_produksi_order_rows_seed: OrderSummary[] = [
  {
    id: "PO-20260316-001",
    product_name: "Coffee Beans Arabica 250gr",
    target_qty: 500,
    status: "ongoing",
    start_date: "2026-03-15",
  },
  {
    id: "PO-20260316-002",
    product_name: "Chocolate Blend 500gr",
    target_qty: 320,
    status: "draft",
    start_date: "2026-03-16",
  },
  {
    id: "PO-20260316-003",
    product_name: "Syrup Caramel 1L",
    target_qty: 220,
    status: "done",
    start_date: "2026-03-12",
  },
  {
    id: "PO-20260316-004",
    product_name: "Matcha Mix 400gr",
    target_qty: 280,
    status: "draft",
    start_date: "2026-03-10",
  },
  {
    id: "PO-20260316-005",
    product_name: "Roasted Robusta 1kg",
    target_qty: 150,
    status: "ongoing",
    start_date: "2026-03-16",
  },
  {
    id: "PO-20260316-006",
    product_name: "Vanilla Cream Powder 500gr",
    target_qty: 260,
    status: "draft",
    start_date: "2026-03-17",
  },
  {
    id: "PO-20260316-007",
    product_name: "Hazelnut Syrup 750ml",
    target_qty: 180,
    status: "done",
    start_date: "2026-03-13",
  },
];

const production_t_qc_inbound_rows_seed: QcSummary[] = [
  {
    id: "QCI-20260316-001",
    reference_id: "PO-MAT-202603-121",
    product_name: "Biji Kopi Arabica Grade A",
    qty: 180,
    status: "pass",
    date: "2026-03-16",
  },
  {
    id: "QCI-20260316-002",
    reference_id: "PO-MAT-202603-122",
    product_name: "Susu Bubuk Full Cream",
    qty: 140,
    status: "pass",
    date: "2026-03-16",
  },
  {
    id: "QCI-20260316-003",
    reference_id: "PO-MAT-202603-123",
    product_name: "Kemasan Pouch 250gr",
    qty: 1000,
    status: "reject",
    date: "2026-03-15",
  },
  {
    id: "QCI-20260316-004",
    reference_id: "PO-MAT-202603-124",
    product_name: "Label Produk Batch Maret",
    qty: 950,
    status: "reject",
    date: "2026-03-15",
  },
  {
    id: "QCI-20260316-005",
    reference_id: "PO-MAT-202603-125",
    product_name: "Caramel Concentrate",
    qty: 65,
    status: "pass",
    date: "2026-03-14",
  },
  {
    id: "QCI-20260316-006",
    reference_id: "PO-MAT-202603-126",
    product_name: "Cocoa Powder Premium",
    qty: 120,
    status: "pass",
    date: "2026-03-14",
  },
];

const production_t_qc_outbound_rows_seed: QcSummary[] = [
  {
    id: "QCO-20260316-001",
    reference_id: "BATCH-PROD-240316-A",
    product_name: "Coffee Beans Arabica 250gr",
    qty: 500,
    status: "pass",
    date: "2026-03-16",
  },
  {
    id: "QCO-20260316-002",
    reference_id: "BATCH-PROD-240316-B",
    product_name: "Chocolate Blend 500gr",
    qty: 320,
    status: "pass",
    date: "2026-03-16",
  },
  {
    id: "QCO-20260316-003",
    reference_id: "BATCH-PROD-240315-C",
    product_name: "Syrup Caramel 1L",
    qty: 220,
    status: "reject",
    date: "2026-03-15",
  },
  {
    id: "QCO-20260316-004",
    reference_id: "BATCH-PROD-240315-D",
    product_name: "Matcha Mix 400gr",
    qty: 280,
    status: "reject",
    date: "2026-03-15",
  },
  {
    id: "QCO-20260316-005",
    reference_id: "BATCH-PROD-240314-E",
    product_name: "Roasted Robusta 1kg",
    qty: 150,
    status: "pass",
    date: "2026-03-14",
  },
  {
    id: "QCO-20260316-006",
    reference_id: "BATCH-PROD-240314-F",
    product_name: "Vanilla Cream Powder 500gr",
    qty: 260,
    status: "pass",
    date: "2026-03-14",
  },
  {
    id: "QCO-20260316-007",
    reference_id: "BATCH-PROD-240313-G",
    product_name: "Hazelnut Syrup 750ml",
    qty: 180,
    status: "reject",
    date: "2026-03-13",
  },
];

const quick_links = [
  {
    href: "/produksi/orders",
    title: "Daftar Pesanan Produksi",
    description: "Kelola antrean batch dan progres produksi harian.",
  },
  {
    href: "/produksi/qc/inbound",
    title: "QC Bahan Baku Masuk",
    description: "Lanjutkan inspeksi material supplier sebelum masuk gudang.",
  },
  {
    href: "/produksi/qc/outbound",
    title: "QC Produk Jadi",
    description: "Evaluasi kualitas akhir produk sebelum serah logistik.",
  },
];

const order_status_label: Record<OrderStatus, string> = {
  draft: "Draft",
  ongoing: "Berjalan",
  done: "Selesai",
};

const order_status_class: Record<OrderStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  ongoing: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
};

const qc_result_label: Record<QcResultStatus, string> = {
  pass: "Pass",
  reject: "Reject",
};

const qc_result_class: Record<QcResultStatus, string> = {
  pass: "bg-emerald-100 text-emerald-700",
  reject: "bg-rose-100 text-rose-700",
};

export default function ProduksiDashboardPage() {
  const [production_t_produksi_order_rows] = useState<OrderSummary[]>(
    production_t_produksi_order_rows_seed,
  );
  const [production_t_qc_inbound_rows] = useState<QcSummary[]>(
    production_t_qc_inbound_rows_seed,
  );
  const [production_t_qc_outbound_rows] = useState<QcSummary[]>(
    production_t_qc_outbound_rows_seed,
  );

  const pesanan_aktif_count = useMemo(() => {
    return production_t_produksi_order_rows.filter(
      (item) => item.status === "ongoing",
    ).length;
  }, [production_t_produksi_order_rows]);

  const antrean_qc_inbound_count = useMemo(() => {
    return production_t_qc_inbound_rows.filter((item) => item.status === "reject").length;
  }, [production_t_qc_inbound_rows]);

  const outbound_checked_rows = useMemo(() => {
    return production_t_qc_outbound_rows;
  }, [production_t_qc_outbound_rows]);

  const outbound_passed_rate = useMemo(() => {
    if (outbound_checked_rows.length === 0) return 0;
    const passed_count = outbound_checked_rows.filter((item) => item.status === "pass").length;
    return Math.round((passed_count / outbound_checked_rows.length) * 100);
  }, [outbound_checked_rows]);

  const pesanan_berjalan_rows = useMemo(() => {
    return production_t_produksi_order_rows
      .filter((item) => item.status === "ongoing")
      .slice(0, 5);
  }, [production_t_produksi_order_rows]);

  const hasil_qc_terbaru_rows = useMemo(() => {
    return [...production_t_qc_outbound_rows]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [production_t_qc_outbound_rows]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard Utama Produksi</h1>
        <p className="text-sm md:text-base text-slate-600">
          Command Center untuk monitoring pesanan dan kualitas dari inbound sampai outbound.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#BC934B]/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pesanan Aktif (Orders)</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{pesanan_aktif_count} Batch</p>
              <p className="text-xs md:text-sm text-slate-600">Sedang dalam proses (In Progress)</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B] shrink-0">
              <ClipboardList className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-amber-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-amber-100/80" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Antrean QC Inbound</p>
              <p className="text-base md:text-2xl font-bold text-amber-700">{antrean_qc_inbound_count} Inspeksi</p>
              <p className="text-xs md:text-sm text-amber-700/80">Bahan baku dengan hasil reject</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-emerald-200 bg-white p-4 md:p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="absolute -top-10 -left-8 h-28 w-28 rounded-full bg-emerald-100/80" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Lolos QC Akhir (Outbound)</p>
              <p className="text-base md:text-2xl font-bold text-emerald-700">{outbound_passed_rate}%</p>
              <p className="text-xs md:text-sm text-emerald-700/80">Produk jadi siap kirim ke logistik</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <CheckSquare className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-base md:text-lg font-bold text-slate-900">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quick_links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#BC934B]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-sm md:text-base font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs md:text-sm text-slate-600">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-[#BC934B] group-hover:translate-x-0.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Pesanan Berjalan</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Ringkasan dari /produksi/orders</p>
          </div>

          <div className="px-4 md:px-6 py-4 overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">ID Pesanan</th>
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Produk</th>
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Target Qty</th>
                  <th className="pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pesanan_berjalan_rows.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-2 text-sm font-semibold text-slate-800 break-all">{item.id}</td>
                    <td className="py-3 pr-2 text-sm text-slate-700 break-words">{item.product_name}</td>
                    <td className="py-3 pr-2 text-sm text-slate-700 whitespace-nowrap">{item.target_qty} Unit</td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${order_status_class[item.status]}`}>
                        {order_status_label[item.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Hasil QC Terbaru</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Ringkasan dari /produksi/qc/outbound</p>
          </div>

          <div className="px-4 md:px-6 py-4 overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">ID Batch</th>
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Produk</th>
                  <th className="pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasil_qc_terbaru_rows.map((item) => {
                  const resultStatus = item.status;
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-2 text-sm font-semibold text-slate-800 break-all">{item.reference_id}</td>
                      <td className="py-3 pr-2 text-sm text-slate-700 break-words">{item.product_name}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${qc_result_class[resultStatus]}`}>
                          {qc_result_label[resultStatus]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}