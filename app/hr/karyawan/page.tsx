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

type EmployeePhotoFiles = {
  foto_perorangan: File | null;
  foto_ktp: File | null;
  foto_kk: File | null;
};

const EMPTY_PHOTO_FILES: EmployeePhotoFiles = {
  foto_perorangan: null,
  foto_ktp: null,
  foto_kk: null,
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
  "Admin",
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
  const [photoFiles, setPhotoFiles] = useState<EmployeePhotoFiles>(EMPTY_PHOTO_FILES);

  // Metrics for Detail Modal
  const [metrics, setMetrics] = useState<{
    assessmentScore: number | null;
    attendanceRate: number | null;
    hadir: number;
    workingDays: number;
  }>({
    assessmentScore: null,
    attendanceRate: null,
    hadir: 0,
    workingDays: 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

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
    nik: string;
    nip: string;
    alamat_domisili: string;
    nomor_whatsapp: string;
    email_pribadi: string;
    foto_perorangan_url: string;
    foto_ktp_url: string;
    foto_kk_url: string;
    pendidikan_terakhir: string;
    jurusan: string;
    pengalaman_kerja_sebelumnya: string;
    keahlian_khusus: string;
    motivasi_kerja: string;
  }>({
    email: "",
    password: "",
    role: "",
    nama: "",
    posisi: "",
    divisi: "",
    status: "aktif",
    nik: "",
    nip: "",
    alamat_domisili: "",
    nomor_whatsapp: "",
    email_pribadi: "",
    foto_perorangan_url: "",
    foto_ktp_url: "",
    foto_kk_url: "",
    pendidikan_terakhir: "",
    jurusan: "",
    pengalaman_kerja_sebelumnya: "",
    keahlian_khusus: "",
    motivasi_kerja: "",
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
        const options = allSupported.length > 0 ? allSupported : fromProfiles;
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

  const getEmployeeNip = (item: MKaryawan | null | undefined) => {
    const raw = (item as unknown as Record<string, unknown> | null | undefined)?.nip;
    return typeof raw === "string" && raw.trim() ? raw : "-";
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
      nik: "",
      nip: "",
      alamat_domisili: "",
      nomor_whatsapp: "",
      email_pribadi: "",
      foto_perorangan_url: "",
      foto_ktp_url: "",
      foto_kk_url: "",
      pendidikan_terakhir: "",
      jurusan: "",
      pengalaman_kerja_sebelumnya: "",
      keahlian_khusus: "",
      motivasi_kerja: "",
    });
    setGajiPokokInput("");
    setPhotoFiles(EMPTY_PHOTO_FILES);
    setIsDivisiManuallyEdited(false);
    setEditData(null);
  };

  const openAddModal = async () => {
    resetForm();
    setIsFormModalOpen(true);

    try {
      const response = await apiFetch("/api/hr/employees/nip-default", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<{ count: number }>(response);
      const count = payload.data.count;
      
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const nnn = String(count + 1).padStart(3, '0');
      const defaultNip = `NIP-DSA-${mm}${yy}-${nnn}`;
      
      setFormData((prev) => ({ ...prev, nip: defaultNip }));
    } catch (error) {
      console.error("Gagal mengambil default NIP:", error);
    }
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
      nik: item.nik ?? "",
      nip: ((item as unknown as Record<string, unknown>)?.nip as string | undefined) ?? "",
      alamat_domisili: item.alamat_domisili ?? "",
      nomor_whatsapp: item.nomor_whatsapp ?? "",
      email_pribadi: item.email_pribadi ?? "",
      foto_perorangan_url: item.foto_perorangan_url ?? "",
      foto_ktp_url: item.foto_ktp_url ?? "",
      foto_kk_url: item.foto_kk_url ?? "",
      pendidikan_terakhir: item.pendidikan_terakhir ?? "",
      jurusan: item.jurusan ?? "",
      pengalaman_kerja_sebelumnya: item.pengalaman_kerja_sebelumnya ?? "",
      keahlian_khusus: item.keahlian_khusus ?? "",
      motivasi_kerja: item.motivasi_kerja ?? "",
    });
    setGajiPokokInput(item.gaji_pokok != null ? String(item.gaji_pokok) : "");
    setIsDivisiManuallyEdited(false);
    setIsFormModalOpen(true);
  };

  const openDetailModal = async (item: MKaryawan) => {
    setDetailItem(item);
    setIsDetailOpen(true);
    setMetrics({ assessmentScore: null, attendanceRate: null, hadir: 0, workingDays: 0 });

    // Fetch Performance & Attendance Metrics
    try {
      setIsLoadingMetrics(true);
      const now = new Date();
      const bulan = now.getMonth() + 1;
      const tahun = now.getFullYear();

      const params = new URLSearchParams({
        nama: item.nama ?? "",
        bulan: String(bulan),
        tahun: String(tahun),
      });

      // Fetch Attendance
      const attRes = await fetch(`/api/management/penilaian/attendance?${params}`);
      const attResult = await attRes.json();
      const attData = attResult.data?.summary || attResult.summary;

      // Fetch Assessment (Latest rekap)
      const assessRes = await fetch(`/api/management/penilaian`);
      const assessResult = await assessRes.json();
      const assessments = assessResult.data?.items || assessResult.items || [];
      const myAssessment = assessments.find((a: any) => 
        a.nama_karyawan === item.nama && a.bulan === bulan && a.tahun === tahun
      );

      setMetrics({
        attendanceRate: attData?.persentase ?? null,
        hadir: attData?.hadir ?? 0,
        workingDays: attData?.workingDays ?? 0,
        assessmentScore: myAssessment?.skor_akhir_total ?? null,
      });
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    } finally {
      setIsLoadingMetrics(false);
    }
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

  const hasPendingPhotoUpload =
    photoFiles.foto_perorangan !== null || photoFiles.foto_ktp !== null || photoFiles.foto_kk !== null;

  const uploadEmployeePhotos = async (employeeId: string) => {
    if (!hasPendingPhotoUpload) return;

    const uploadFormData = new FormData();
    if (photoFiles.foto_perorangan) uploadFormData.append("foto_perorangan", photoFiles.foto_perorangan);
    if (photoFiles.foto_ktp) uploadFormData.append("foto_ktp", photoFiles.foto_ktp);
    if (photoFiles.foto_kk) uploadFormData.append("foto_kk", photoFiles.foto_kk);

    const uploadResponse = await apiFetch(`/api/hr/employees/${employeeId}/upload-photos`, {
      method: "POST",
      body: uploadFormData,
    });

    await parseJsonResponse<{ karyawan: MKaryawan }>(uploadResponse);
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
      let targetEmployeeId: string | null = editData?.id ?? null;

      if (editData) {
        const payload = {
          nama: formData.nama,
          posisi: formData.posisi,
          divisi: formData.divisi,
          status: formData.status,
          gaji_pokok: parsedGajiPokok,
          nik: formData.nik,
          nip: formData.nip,
          alamat_domisili: formData.alamat_domisili,
          nomor_whatsapp: formData.nomor_whatsapp,
          email_pribadi: formData.email_pribadi || null,
          foto_perorangan_url: formData.foto_perorangan_url || null,
          foto_ktp_url: formData.foto_ktp_url || null,
          foto_kk_url: formData.foto_kk_url || null,
          pendidikan_terakhir: formData.pendidikan_terakhir,
          jurusan: formData.jurusan,
          pengalaman_kerja_sebelumnya: formData.pengalaman_kerja_sebelumnya || null,
          keahlian_khusus: formData.keahlian_khusus || null,
          motivasi_kerja: formData.motivasi_kerja || null,
        };
        const result = await update(editData.id, payload);
        if (!result) throw new Error("Gagal update karyawan.");
        targetEmployeeId = result.id;
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
          nik: formData.nik,
          nip: formData.nip,
          alamat_domisili: formData.alamat_domisili,
          nomor_whatsapp: formData.nomor_whatsapp,
          email_pribadi: formData.email_pribadi || null,
          foto_perorangan_url: formData.foto_perorangan_url || null,
          foto_ktp_url: formData.foto_ktp_url || null,
          foto_kk_url: formData.foto_kk_url || null,
          pendidikan_terakhir: formData.pendidikan_terakhir,
          jurusan: formData.jurusan,
          pengalaman_kerja_sebelumnya: formData.pengalaman_kerja_sebelumnya || null,
          keahlian_khusus: formData.keahlian_khusus || null,
          motivasi_kerja: formData.motivasi_kerja || null,
        };
        const result = await insert(payload);
        if (!result) throw new Error("Gagal menambah karyawan.");
        targetEmployeeId = result.id;
      }

      if (hasPendingPhotoUpload && targetEmployeeId) {
        await uploadEmployeePhotos(targetEmployeeId);
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

  // ── Form Validation ──
  const isFormValid =
    !!formData.nama.trim() &&
    !!formData.posisi.trim() &&
    !!formData.divisi &&
    !!formData.nik &&
    formData.nik.trim().length === 16 &&
    !!formData.nip &&
    !!formData.alamat_domisili.trim() &&
    !!formData.nomor_whatsapp &&
    !!formData.pendidikan_terakhir.trim() &&
    !!formData.jurusan.trim();

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
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">Informasi Pekerjaan & Akun</h4>
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">Data Pribadi</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">NIK (Nomor KTP)</span>
                <input
                  type="text"
                  required
                  value={formData.nik}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nik: event.target.value }))}
                  maxLength={16}
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition ${
                    formData.nik && formData.nik.trim().length !== 16
                      ? 'border-red-400 text-red-900 focus:border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 text-slate-700 focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20'
                  }`}
                />
                {formData.nik && formData.nik.trim().length !== 16 && (
                  <p className="text-xs text-red-500 mt-1">NIK harus terdiri dari 16 digit.</p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">NIP</span>
                <input
                  type="text"
                  required
                  value={formData.nip}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nip: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>
              
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Nomor WhatsApp</span>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  value={formData.nomor_whatsapp}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nomor_whatsapp: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>

              <label className="space-y-1.5 md:col-span-3">
                <span className="text-sm font-medium text-slate-700">Alamat Domisili</span>
                <textarea
                  required
                  value={formData.alamat_domisili}
                  onChange={(event) => setFormData((prev) => ({ ...prev, alamat_domisili: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 min-h-[80px]"
                />
              </label>

              <label className="space-y-1.5 md:col-span-3">
                <span className="text-sm font-medium text-slate-700">Email Pribadi (Opsional)</span>
                <input
                  type="email"
                  value={formData.email_pribadi}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email_pribadi: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">Dokumen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">URL Foto Perorangan (Opsional)</span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.foto_perorangan_url}
                  onChange={(event) => setFormData((prev) => ({ ...prev, foto_perorangan_url: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">URL Foto KTP (Opsional)</span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.foto_ktp_url}
                  onChange={(event) => setFormData((prev) => ({ ...prev, foto_ktp_url: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">URL Foto KK (Opsional)</span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.foto_kk_url}
                  onChange={(event) => setFormData((prev) => ({ ...prev, foto_kk_url: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>

              <label className="space-y-1.5 mt-2">
                <span className="text-sm font-medium text-slate-700">Upload Foto Perorangan</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setPhotoFiles((prev) => ({
                      ...prev,
                      foto_perorangan: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
              </label>

              <label className="space-y-1.5 mt-2">
                <span className="text-sm font-medium text-slate-700">Upload Foto KTP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setPhotoFiles((prev) => ({
                      ...prev,
                      foto_ktp: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Upload Foto KK</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setPhotoFiles((prev) => ({
                      ...prev,
                      foto_kk: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
              </label>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">Latar Belakang</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Pendidikan Terakhir</span>
                <input
                  type="text"
                  required
                  value={formData.pendidikan_terakhir}
                  onChange={(event) => setFormData((prev) => ({ ...prev, pendidikan_terakhir: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>
              
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Jurusan</span>
                <input
                  type="text"
                  required
                  value={formData.jurusan}
                  onChange={(event) => setFormData((prev) => ({ ...prev, jurusan: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Pengalaman Kerja Sebelumnya (Opsional)</span>
                <textarea
                  value={formData.pengalaman_kerja_sebelumnya}
                  onChange={(event) => setFormData((prev) => ({ ...prev, pengalaman_kerja_sebelumnya: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 min-h-[80px]"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Keahlian Khusus (Opsional)</span>
                <textarea
                  value={formData.keahlian_khusus}
                  onChange={(event) => setFormData((prev) => ({ ...prev, keahlian_khusus: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 min-h-[80px]"
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Motivasi Kerja di PT. DSA (Opsional)</span>
                <textarea
                  value={formData.motivasi_kerja}
                  onChange={(event) => setFormData((prev) => ({ ...prev, motivasi_kerja: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 min-h-[80px]"
                />
              </label>
            </div>
          </section>

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
              disabled={isSubmitting || !isFormValid}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="text-xs text-slate-500">NIP</div>
                    <div className="text-sm text-slate-900">{getEmployeeNip(detailItem)}</div>
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

            {/* Performance & Attendance Section */}
            <section className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                Performa & Presensi (Bulan Ini)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Attendance Metric */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">Tingkat Kehadiran</span>
                    <span className="text-xs font-bold text-slate-900">
                      {isLoadingMetrics ? "..." : metrics.attendanceRate !== null ? `${metrics.attendanceRate}%` : "-"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        (metrics.attendanceRate ?? 0) >= 80 ? 'bg-emerald-500' : 
                        (metrics.attendanceRate ?? 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${isLoadingMetrics ? 0 : Math.min(metrics.attendanceRate ?? 0, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isLoadingMetrics ? "Memuat..." : `${metrics.hadir}/${metrics.workingDays} Hari Kerja`}
                  </p>
                </div>

                {/* Performance Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">Nilai Penilaian</span>
                    <span className="text-xs font-bold text-slate-900">
                      {isLoadingMetrics ? "..." : metrics.assessmentScore !== null ? `${Number(metrics.assessmentScore).toFixed(2)}%` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${isLoadingMetrics ? 0 : Math.min(metrics.assessmentScore ?? 0, 100)}%` }}
                      />
                    </div>
                    {metrics.assessmentScore !== null && !isLoadingMetrics && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {metrics.assessmentScore >= 80 ? 'A' : metrics.assessmentScore >= 70 ? 'B' : metrics.assessmentScore >= 60 ? 'C' : 'D'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isLoadingMetrics ? "Memuat..." : metrics.assessmentScore !== null ? "Berdasarkan rekap terbaru" : "Belum ada penilaian"}
                  </p>
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
