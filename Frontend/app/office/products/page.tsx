"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";

type ProdukItem = {
  id: string;
  nama_produk: string;
  kategori: string;
};

type VarianItem = {
  id: string;
  product_id: string;
  nama_varian: string;
  sku: string;
  harga: number;
};

type KategoriFilter = "Semua" | "Minuman" | "Powder" | "Syrup";

const core_m_produk_rows_seed: ProdukItem[] = [
  { id: "prd-001", nama_produk: "Coffee Beans Arabica", kategori: "Minuman" },
  { id: "prd-002", nama_produk: "Coffee Beans Robusta", kategori: "Minuman" },
  { id: "prd-003", nama_produk: "Chocolate Blend", kategori: "Powder" },
  { id: "prd-004", nama_produk: "Matcha Mix", kategori: "Powder" },
  { id: "prd-005", nama_produk: "Vanilla Cream", kategori: "Powder" },
  { id: "prd-006", nama_produk: "Hazelnut Syrup", kategori: "Syrup" },
  { id: "prd-007", nama_produk: "Caramel Syrup", kategori: "Syrup" },
  { id: "prd-008", nama_produk: "Milk Tea Base", kategori: "Minuman" },
  { id: "prd-009", nama_produk: "Signature Latte Base", kategori: "Minuman" },
  { id: "prd-010", nama_produk: "Mocha Premix", kategori: "Powder" },
  { id: "prd-011", nama_produk: "Fresh Tea Concentrate", kategori: "Concentrate" },
  { id: "prd-012", nama_produk: "Fruit Syrup Series", kategori: "Syrup" },
];

const core_m_varian_rows_seed: VarianItem[] = Array.from({ length: 42 }, (_, index) => {
  const product = core_m_produk_rows_seed[index % core_m_produk_rows_seed.length];
  const varianNo = Math.floor(index / core_m_produk_rows_seed.length) + 1;

  return {
    id: `var-${String(index + 1).padStart(3, "0")}`,
    product_id: product.id,
    nama_varian: `${product.nama_produk} Varian ${varianNo}`,
    sku: `${product.id.toUpperCase()}-V${String(varianNo).padStart(2, "0")}`,
    harga: 45000 + (index % 6) * 5000,
  };
});

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OfficeProductsPage() {
  const [produkItems] = useState<ProdukItem[]>(core_m_produk_rows_seed);
  const [varianItems, setVarianItems] = useState<VarianItem[]>(core_m_varian_rows_seed);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<KategoriFilter>("Semua");
  const [isVarianModalOpen, setIsVarianModalOpen] = useState(false);
  const [selectedProduk, setSelectedProduk] = useState<ProdukItem | null>(null);

  const [formNamaVarian, setFormNamaVarian] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formHarga, setFormHarga] = useState("");

  const filteredProdukCards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return produkItems
      .map((produk) => {
        const relatedVarian = varianItems.filter(
          (varian) => varian.product_id === produk.id,
        );

        const matchesKategori =
          selectedKategori === "Semua" || produk.kategori === selectedKategori;

        const matchesSearch =
          normalizedSearch.length === 0 ||
          produk.nama_produk.toLowerCase().includes(normalizedSearch) ||
          relatedVarian.some(
            (varian) =>
              varian.nama_varian.toLowerCase().includes(normalizedSearch) ||
              varian.sku.toLowerCase().includes(normalizedSearch),
          );

        return {
          ...produk,
          relatedVarian,
          isVisible: matchesKategori && matchesSearch,
        };
      })
      .filter((item) => item.isVisible);
  }, [produkItems, varianItems, searchTerm, selectedKategori]);

  const handleOpenVarianModal = (produk: ProdukItem) => {
    setSelectedProduk(produk);
    setFormNamaVarian("");
    setFormSku("");
    setFormHarga("");
    setIsVarianModalOpen(true);
  };

  const handleCloseVarianModal = () => {
    setIsVarianModalOpen(false);
    setSelectedProduk(null);
    setFormNamaVarian("");
    setFormSku("");
    setFormHarga("");
  };

  const handleSaveVarian = () => {
    if (!selectedProduk) return;

    const namaVarian = formNamaVarian.trim();
    const sku = formSku.trim().toUpperCase();
    const harga = Number(formHarga);

    if (!namaVarian || !sku || Number.isNaN(harga) || harga <= 0) return;

    const newVarian: VarianItem = {
      id: `var-${String(Date.now()).slice(-6)}`,
      product_id: selectedProduk.id,
      nama_varian: namaVarian,
      sku,
      harga,
    };

    setVarianItems((currentItems) => [newVarian, ...currentItems]);
    handleCloseVarianModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Katalog Produk &amp; Varian</h1>
        <p className="text-sm md:text-base text-slate-600">
          Kelola master data produk dan varian SKU yang terdaftar di sistem.
        </p>
      </section>

      <section className="flex flex-col gap-3 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-3xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama produk, nama varian, atau SKU..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <select
            value={selectedKategori}
            onChange={(event) => setSelectedKategori(event.target.value as KategoriFilter)}
            className="w-full sm:w-52 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
          >
            <option value="Semua">Semua</option>
            <option value="Minuman">Minuman</option>
            <option value="Powder">Powder</option>
            <option value="Syrup">Syrup</option>
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk Baru
        </button>
      </section>

      <section className="space-y-4">
        {filteredProdukCards.length === 0 ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
            Tidak ada produk yang sesuai dengan filter pencarian.
          </article>
        ) : (
          filteredProdukCards.map((produk) => (
            <details
              key={produk.id}
              open
              className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <summary className="list-none cursor-pointer p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm md:text-base font-bold text-slate-900 break-words">
                      {produk.nama_produk}
                    </p>
                    <div>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {produk.kategori}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline text-xs text-slate-500">
                      {produk.relatedVarian.length} varian
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                  </div>
                </div>
              </summary>

              <div className="border-t border-slate-100 p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs md:text-sm font-semibold text-slate-600">
                    Daftar Varian SKU
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenVarianModal(produk)}
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#BC934B] hover:text-[#a88444] transition whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Varian
                  </button>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[520px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Nama Varian
                        </th>
                        <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          SKU
                        </th>
                        <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Harga
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {produk.relatedVarian.length === 0 ? (
                        <tr>
                          <td className="px-3 md:px-4 py-3 text-sm text-slate-500" colSpan={3}>
                            Belum ada varian untuk produk ini.
                          </td>
                        </tr>
                      ) : (
                        produk.relatedVarian.map((varian) => (
                          <tr key={varian.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 md:px-4 py-3 text-sm text-slate-800 break-words">
                              {varian.nama_varian}
                            </td>
                            <td className="px-3 md:px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                              {varian.sku}
                            </td>
                            <td className="px-3 md:px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                              {formatRupiah(varian.harga)}
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

      <Modal
        isOpen={isVarianModalOpen}
        onClose={handleCloseVarianModal}
        title={`Tambah Varian - ${selectedProduk?.nama_produk ?? ""}`}
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveVarian();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="nama-varian" className="text-sm font-semibold text-slate-700">
              Nama Varian
            </label>
            <input
              id="nama-varian"
              type="text"
              value={formNamaVarian}
              onChange={(event) => setFormNamaVarian(event.target.value)}
              placeholder="Masukkan nama varian"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sku-varian" className="text-sm font-semibold text-slate-700">
              SKU
            </label>
            <input
              id="sku-varian"
              type="text"
              value={formSku}
              onChange={(event) => setFormSku(event.target.value)}
              placeholder="Contoh: PRD-001-V99"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="harga-varian" className="text-sm font-semibold text-slate-700">
              Harga (Rp)
            </label>
            <input
              id="harga-varian"
              type="number"
              min={0}
              value={formHarga}
              onChange={(event) => setFormHarga(event.target.value)}
              placeholder="Masukkan harga varian"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseVarianModal}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444]"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
