"use client";
import { SearchBar } from "@/components/ui/search-bar";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, PlusCircle, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { CoreUserRole, HrEmployeeStatus, MKaryawan } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DeleteButton, DetailButton } from "@/components/ui/RowActions";
import {
  useKaryawan,
  useInsertKaryawan,
  useUpdateKaryawan,
  useDeleteKaryawan,
} from "@/lib/supabase/hooks/index";

// use MKaryawan from types/supabase for full employee shape

type RolesPayload = {
  roles_in_profiles: CoreUserRole[];
  recommended_roles: CoreUserRole[];
  all_supported_roles: CoreUserRole[];
  system_role_keys: string[];
};

const FALLBACK_DIVISI_OPTIONS = [
  "Management & Strategy",
  "Finance & Administration",
  "HR & Operation Manager",
  "Produksi & Quality Control",
  "Logistics & Packing",
  "Creative & Sales",
  "Office Support",
  "Super Admin",
  "CEO",
  "Finance",
  "HR",
  "Produksi",
  "Logistik",
  "Creative",
  "Office",
];

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function Badge({ status }: { status: HrEmployeeStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "aktif"
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white"
      }`}
    >
      {status}
    </span>
  );
}

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

export default function KaryawanPage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [roleOptions, setRoleOptions] = useState<CoreUserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<MKaryawan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [gajiPokokInput, setGajiPokokInput] = useState<string>("");
  const [isDivisiManuallyEdited, setIsDivisiManuallyEdited] = useState<boolean>(false);
  const [detailItem, setDetailItem] = useState<MKaryawan | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const divisiOptions = useMemo(() => {
    return roleOptions.length > 0 ? roleOptions : FALLBACK_DIVISI_OPTIONS;
  }, [roleOptions]);

  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    role: CoreUserRole | "";
    nama: string;
    posisi: string;
    divisi: string;
    status: HrEmployeeStatus;
  }>({
    email: "",
    password: "",
    role: "",
    nama: "",
    posisi: "",
    divisi: "",
    status: "aktif",
  });

  // ── Supabase Direct ──
  const { data: rawKaryawan, loading: isLoading, refresh } = useKaryawan();
  const { insert } = useInsertKaryawan();
  const { update } = useUpdateKaryawan();
  const { remove } = useDeleteKaryawan();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiFetch("/api/hr/roles", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const payload = await parseJsonResponse<RolesPayload>(response);
        const fromProfiles = payload.data.roles_in_profiles ?? [];
        const allSupported = payload.data.all_supported_roles ?? [];
        const options = fromProfiles.length > 0 ? fromProfiles : allSupported;
        setRoleOptions(Array.from(new Set(options)));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memuat daftar role.";
        alert(message);
      }
    };

    void fetchRoles();
  }, []);

  // ── Normalize karyawan data ──
  const items: MKaryawan[] = useMemo(
    () =>
      rawKaryawan.map((item: MKaryawan) =>
        ({
          ...item,
          posisi: item.posisi ?? "",
          divisi: item.divisi ?? divisiOptions[0],
          status: item.status ?? "aktif",
          gaji_pokok: item.gaji_pokok ?? 0,
        } as MKaryawan),
      ),
    [rawKaryawan, divisiOptions],
  );

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => (item.nama ?? "").toLowerCase().includes(keyword));
  }, [items, searchTerm]);

  const getInitials = (name?: string) => {
    if (!name) return "--";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "--";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  useEffect(() => {
    if (divisiOptions.length === 0) return;
    setFormData((prev) => {
      if (prev.divisi && divisiOptions.includes(prev.divisi)) return prev;
      return { ...prev, divisi: divisiOptions[0] };
    });
  }, [divisiOptions]);

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      role: (divisiOptions[0] as CoreUserRole) ?? "",
      nama: "",
      posisi: "",
      divisi: divisiOptions[0] ?? "",
      status: "aktif",
    });
    setGajiPokokInput("");
    setIsDivisiManuallyEdited(false);
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: MKaryawan) => {
    setEditData(item as unknown as MKaryawan);
    setFormData({
      email: "",
      password: "",
      role: (item.divisi as CoreUserRole) ?? "",
      nama: item.nama ?? "",
      posisi: item.posisi ?? "",
      divisi: item.divisi ?? divisiOptions[0] ?? "",
      status: item.status ?? "aktif",
    });
    setGajiPokokInput(item.gaji_pokok != null ? String(item.gaji_pokok) : "");
    setIsDivisiManuallyEdited(false);
    setIsFormModalOpen(true);
  };

  const openDetailModal = (item: MKaryawan) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setDetailItem(null);
    setIsDetailOpen(false);
  };

  // Lock background scroll when detail modal is open (per-page)
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isDetailOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original || "";
      };
    }
    return () => {};
  }, [isDetailOpen]);

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedGajiPokok = Number(gajiPokokInput);
    if (!gajiPokokInput.trim() || Number.isNaN(parsedGajiPokok) || parsedGajiPokok < 0) {
      alert("Gaji pokok wajib berupa angka valid (>= 0).");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editData) {
        const payload = {
          nama: formData.nama,
          posisi: formData.posisi,
          divisi: formData.divisi,
          status: formData.status,
          gaji_pokok: parsedGajiPokok,
        };
        const result = await update(editData.id, payload);
        if (!result) throw new Error("Gagal update karyawan.");
      } else {
        if (!formData.email.trim()) {
          throw new Error("Email wajib diisi.");
        }
        if (!formData.password || formData.password.length < 6) {
          throw new Error("Password minimal 6 karakter.");
        }
        if (!formData.role) {
          throw new Error("Role wajib dipilih.");
        }

        const payload = {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
          nama: formData.nama,
          posisi: formData.posisi,
          divisi: formData.divisi,
          status: formData.status,
          gaji_pokok: parsedGajiPokok,
        };
        const result = await insert(payload);
        if (!result) throw new Error("Gagal menambah karyawan.");
      }

      refresh();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan karyawan gagal.";
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
    if (!deleteId) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await remove(deleteId);
      if (!success) throw new Error("Gagal menghapus karyawan.");
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus karyawan.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
          Direktori Karyawan
        </h1>
        <p className="text-sm md:text-base text-slate-200">
          Kelola data induk, posisi, dan status aktif karyawan.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari nama karyawan..."
            className="relative w-full sm:max-w-md"
          />

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          <PlusCircle size={18} />
          Tambah Karyawan
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Foto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Divisi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Posisi</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data...</td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {item.foto_perorangan_url ? (
                        <img
                          src={item.foto_perorangan_url}
                          alt={item.nama ?? "foto"}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
                          {getInitials(item.nama)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.nama}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.divisi}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.posisi}</td>
                  <td className="px-4 py-3 text-center"><Badge status={(item.status ?? "nonaktif") as HrEmployeeStatus} /></td>
                  <td className="px-4 py-3">
                    <RowActions>
                      <DetailButton onClick={() => openDetailModal(item)} />
                      <EditButton onClick={() => openEditModal(item)} />
                      <DeleteButton onClick={() => openDeleteModal(item.id)} />
                    </RowActions>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Data karyawan tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editData ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editData ? (
              <>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, password: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Role</span>
                  <select
                    required
                    value={formData.role}
                    onChange={(event) => {
                      const selectedRole = event.target.value as CoreUserRole;
                      setFormData((prev) => ({
                        ...prev,
                        role: selectedRole,
                        divisi: !isDivisiManuallyEdited ? selectedRole : prev.divisi,
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                  >
                    <option value="" disabled>Pilih role</option>
                    {divisiOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nama</span>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, nama: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Posisi</span>
              <input
                type="text"
                required
                value={formData.posisi}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, posisi: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Divisi</span>
              <select
                value={formData.divisi}
                onChange={(event) => {
                  setIsDivisiManuallyEdited(true);
                  setFormData((prev) => ({ ...prev, divisi: event.target.value }));
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              >
                {divisiOptions.map((divisi) => (
                  <option key={divisi} value={divisi}>
                    {divisi}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                value={formData.status}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: event.target.value as HrEmployeeStatus,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              >
                <option value="aktif">aktif</option>
                <option value="nonaktif">nonaktif</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Gaji Pokok</span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={gajiPokokInput}
                onChange={(event) => setGajiPokokInput(event.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Karyawan"
        description="Apakah Anda yakin ingin menghapus data karyawan ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
      <Modal isOpen={isDetailOpen} onClose={closeDetailModal} title="Detail Karyawan" maxWidth="max-w-2xl">
        {detailItem ? (
          <div className="space-y-4">
            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Data Pribadi</h4>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {detailItem.foto_perorangan_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detailItem.foto_perorangan_url} alt={detailItem.nama ?? "foto"} className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center text-xl font-semibold text-slate-700">{getInitials(detailItem.nama)}</div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-500">NIK</div>
                    <div className="text-sm text-slate-900">{detailItem.nik ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Nama Lengkap</div>
                    <div className="text-sm text-slate-900">{detailItem.nama}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Alamat Domisili</div>
                    <div className="text-sm text-slate-900">{detailItem.alamat_domisili ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Nomor WhatsApp</div>
                    <div className="text-sm text-slate-900">{detailItem.nomor_whatsapp ?? "-"}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-slate-500">Email Pribadi</div>
                    <div className="text-sm text-slate-900">{detailItem.email_pribadi ?? "-"}</div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Dokumen</h4>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">Foto KTP</div>
                  {detailItem.foto_ktp_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detailItem.foto_ktp_url} alt="KTP" className="w-full max-h-56 object-cover rounded-md border" />
                  ) : (
                    <div className="w-full h-36 rounded-md bg-slate-100 flex items-center justify-center text-sm text-slate-500">Tidak ada foto</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">Foto KK</div>
                  {detailItem.foto_kk_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detailItem.foto_kk_url} alt="KK" className="w-full max-h-56 object-cover rounded-md border" />
                  ) : (
                    <div className="w-full h-36 rounded-md bg-slate-100 flex items-center justify-center text-sm text-slate-500">Tidak ada foto</div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Pekerjaan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-500">Divisi</div>
                  <div className="text-sm text-slate-900">{detailItem.divisi ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Posisi</div>
                  <div className="text-sm text-slate-900">{detailItem.posisi ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="text-sm text-slate-900"><Badge status={detailItem.status ?? "nonaktif"} /></div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Gaji Pokok</div>
                  <div className="text-sm text-slate-900">{rupiahFormatter.format(detailItem.gaji_pokok ?? 0)}</div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Latar Belakang</h4>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <div className="text-xs text-slate-500">Pendidikan Terakhir</div>
                  <div className="text-sm text-slate-900">{detailItem.pendidikan_terakhir ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Jurusan</div>
                  <div className="text-sm text-slate-900">{detailItem.jurusan ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Pengalaman Kerja Sebelumnya</div>
                  <div className="text-sm text-slate-900">{detailItem.pengalaman_kerja_sebelumnya ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Keahlian Khusus</div>
                  <div className="text-sm text-slate-900">{detailItem.keahlian_khusus ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Motivasi Kerja</div>
                  <div className="text-sm text-slate-900">{detailItem.motivasi_kerja ?? "-"}</div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div>Memuat...</div>
        )}
      </Modal>
    </div>
  );
}
