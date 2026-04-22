"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MProduk, MVarian } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { useProfile } from "@/hooks/use-profile";

type ProductsListPayload = {
  produk: MProduk[];
  meta: { page: number; limit: number; total: number };
};

type VariantsListPayload = {
  varian: MVarian[];
};

type ProductPayload = {
  produk: MProduk | null;
};

type VariantPayload = {
  varian: MVarian | null;
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

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OfficeProductsPage() {
  const { role } = useProfile();
  const isOfficeSupport = role === "Office Support";

  const [produkItems, setProdukItems] = useState<MProduk[]>([]);
  const [varianItems, setVarianItems] = useState<MVarian[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [formNamaProduk, setFormNamaProduk] = useState("");
  const [formKategoriProduk, setFormKategoriProduk] = useState("");

  const [isVarianModalOpen, setIsVarianModalOpen] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState<MProduk | null>(null);
  const [formNamaVarian, setFormNamaVarian] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formHarga, setFormHarga] = useState("");

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [productsRes, variantsRes] = await Promise.all([
        apiFetch("/api/core/products?page=1&limit=500", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }),
        apiFetch("/api/core/variants", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }),
      ]);

      const productsPayload = await parseJsonResponse<ProductsListPayload>(productsRes);
      const variantsPayload = await parseJsonResponse<VariantsListPayload>(variantsRes);

      setProdukItems(productsPayload.data.produk ?? []);
      setVarianItems(variantsPayload.data.varian ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data produk.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const kategoriOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(produkItems.map((item) => (item.kategori ?? "Tanpa Kategori").trim() || "Tanpa Kategori")),
    );
    return ["Semua", ...fromData];
  }, [produkItems]);

  const filteredProdukCards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return produkItems
      .map((produk) => {
        const relatedVarian = varianItems.filter((varian) => varian.product_id === produk.id);
        const kategoriLabel = (produk.kategori ?? "Tanpa Kategori").trim() || "Tanpa Kategori";

        const matchesKategori = selectedKategori === "Semua" || kategoriLabel === selectedKategori;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          produk.nama_produk.toLowerCase().includes(normalizedSearch) ||
          relatedVarian.some(
            (varian) =>
              (varian.nama_varian ?? "").toLowerCase().includes(normalizedSearch) ||
              (varian.sku ?? "").toLowerCase().includes(normalizedSearch),
          );

        return {
          ...produk,
          kategoriLabel,
          relatedVarian,
          isVisible: matchesKategori && matchesSearch,
        };
      })
      .filter((item) => item.isVisible);
  }, [produkItems, varianItems, searchTerm, selectedKategori]);

  const openProductModal = () => {
    setFormNamaProduk("");
    setFormKategoriProduk("");
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setFormNamaProduk("");
    setFormKategoriProduk("");
  };

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const namaProduk = formNamaProduk.trim();
    if (!namaProduk) {
      alert("Nama produk wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/core/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_produk: namaProduk,
          kategori: formKategoriProduk.trim() || null,
        }),
      });
      await parseJsonResponse<ProductPayload>(response);
      await fetchAll();
      closeProductModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menambah produk.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVarianModal = (produk: MProduk) => {
    setSelectedProduk(produk);
    setFormNamaVarian("");
    setFormSku("");
    setFormHarga("");
    setIsVarianModalOpen(true);
  };

  const closeVarianModal = () => {
    setIsVarianModalOpen(false);
    setSelectedProduk(null);
    setFormNamaVarian("");
    setFormSku("");
    setFormHarga("");
  };

  const handleSaveVarian = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduk || isSubmitting) return;

    const harga = Number(formHarga);
    if (Number.isNaN(harga) || harga < 0) {
      alert("Harga varian harus angka valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/core/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduk.id,
          nama_varian: formNamaVarian.trim() || null,
          sku: formSku.trim() || null,
          harga,
        }),
      });
      await parseJsonResponse<VariantPayload>(response);
      await fetchAll();
      closeVarianModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menambah varian.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Katalog Produk dan Varian</h1>
        <p className="text-sm md:text-base text-slate-300">Kelola master data produk dan varian SKU dari database core.</p>
      </section>

<section className="w-full xl:flex xl:flex-row xl:items-center xl:justify-between">
  <div className="flex w-full md:grid-cols-2 gap-3 md:gap-4 xl:max-w-3xl">
    
    <SearchBar
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Cari nama produk, nama varian, atau SKU..."
      className="relative w-full"
    />

    <select
      value={selectedKategori}
      onChange={(event) => setSelectedKategori(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-b-slate-300 focus:ring-2 focus:ring-slate-300/20"
    >
      {kategoriOptions.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
    
  </div>
</section>

      <section className="space-y-4">
        {isLoading ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Memuat data produk...
          </article>
        ) : filteredProdukCards.length === 0 ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Tidak ada produk yang sesuai dengan filter pencarian.
          </article>
        ) : (
          filteredProdukCards.map((produk) => (
            <details key={produk.id} open className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <summary className="list-none cursor-pointer p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm md:text-base font-bold text-slate-900 break-words">{produk.nama_produk}</p>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {produk.kategoriLabel}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-xs text-slate-500">{produk.relatedVarian.length} varian</span>
                </div>
              </summary>

              <div className="border-t border-slate-100 p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs md:text-sm font-semibold text-slate-600">Daftar Varian SKU</p>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[520px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Nama Varian</th>
                        <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">SKU</th>
                        <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {produk.relatedVarian.length === 0 ? (
                        <tr>
                          <td className="px-3 md:px-4 py-3 text-sm text-slate-500" colSpan={3}>Belum ada varian untuk produk ini.</td>
                        </tr>
                      ) : (
                        produk.relatedVarian.map((varian) => (
                          <tr key={varian.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 md:px-4 py-3 text-sm text-slate-800 break-words">{varian.nama_varian ?? "-"}</td>
                            <td className="px-3 md:px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{varian.sku ?? "-"}</td>
                            <td className="px-3 md:px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                              {formatRupiah(varian.harga ?? 0)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          ))
        )}
      </section>

      <Modal isOpen={isProductModalOpen} onClose={closeProductModal} title="Tambah Produk" maxWidth="max-w-lg">
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nama-produk" className="text-sm font-semibold text-slate-700">Nama Produk</label>
            <input
              id="nama-produk"
              type="text"
              value={formNamaProduk}
              onChange={(event) => setFormNamaProduk(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              placeholder="Masukkan nama produk"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="kategori-produk" className="text-sm font-semibold text-slate-700">Kategori</label>
            <input
              id="kategori-produk"
              type="text"
              value={formKategoriProduk}
              onChange={(event) => setFormKategoriProduk(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              placeholder="Contoh: Minuman"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeProductModal} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isVarianModalOpen} onClose={closeVarianModal} title={`Tambah Varian - ${selectedProduk?.nama_produk ?? ""}`} maxWidth="max-w-lg">
        <form onSubmit={handleSaveVarian} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nama-varian" className="text-sm font-semibold text-slate-700">Nama Varian</label>
            <input
              id="nama-varian"
              type="text"
              value={formNamaVarian}
              onChange={(event) => setFormNamaVarian(event.target.value)}
              placeholder="Masukkan nama varian"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sku-varian" className="text-sm font-semibold text-slate-700">SKU</label>
            <input
              id="sku-varian"
              type="text"
              value={formSku}
              onChange={(event) => setFormSku(event.target.value)}
              placeholder="Contoh: PRD-001-V99"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="harga-varian" className="text-sm font-semibold text-slate-700">Harga (Rp)</label>
            <input
              id="harga-varian"
              type="number"
              min={0}
              value={formHarga}
              onChange={(event) => setFormHarga(event.target.value)}
              placeholder="Masukkan harga varian"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeVarianModal} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
