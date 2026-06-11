"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function PublicBukuTamuPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [otherSource, setOtherSource] = useState(false);
  const [customSource, setCustomSource] = useState("");

  const [formData, setFormData] = useState({
    nama_kamu: "",
    nomor_telepon: "",
    alamat: "",
    keperluan: "",
    asal_instansi: "",
    tau_utero_darimana: "",
    kritik_saran: "",
    status_hello: "",
  });

  const handleSourceChange = (val: string) => {
    if (val === "Other") {
      setOtherSource(true);
      setFormData((prev) => ({ ...prev, tau_utero_darimana: "" }));
    } else {
      setOtherSource(false);
      setFormData((prev) => ({ ...prev, tau_utero_darimana: val }));
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validasi input
    if (!formData.nama_kamu.trim()) {
      setError("Nama Lengkap wajib diisi!");
      return;
    }
    if (!formData.nomor_telepon.trim()) {
      setError("Nomor Telepon wajib diisi!");
      return;
    }
    if (!formData.keperluan.trim()) {
      setError("Keperluan kunjungan wajib diisi!");
      return;
    }
    const finalSource = otherSource ? customSource.trim() : formData.tau_utero_darimana;
    if (!finalSource) {
      setError("Harap isi darimana Anda mengetahui Suryo Agong!");
      return;
    }
    if (!formData.status_hello) {
      setError("Harap pilih status kedatangan Anda!");
      return;
    }

    const payload = {
      ...formData,
      tau_utero_darimana: finalSource,
    };

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: insertError } = await supabase
        .from("buku_tamu")
        .insert(payload as any);

      if (!insertError) {
        setSuccess(true);
        setFormData({
          nama_kamu: "",
          nomor_telepon: "",
          alamat: "",
          keperluan: "",
          asal_instansi: "",
          tau_utero_darimana: "",
          kritik_saran: "",
          status_hello: "",
        });
        setOtherSource(false);
        setCustomSource("");
      } else {
        setError(insertError.message || "Gagal mengirim data tamu. Silakan coba lagi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-display relative flex min-h-screen items-center justify-center bg-[#0b0f19] py-12 px-4 sm:px-6 lg:px-8 antialiased overflow-x-hidden">
      {/* Dynamic premium glowing background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#BC934B]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#BC934B]/5 rounded-full blur-[120px]" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-[#BC934B]"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Kembali ke Utama</span>
        </Link>
      </div>

      {/* Focused full card form container */}
      <div className="relative z-10 w-full max-w-2xl bg-slate-900/80 border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-10 backdrop-blur-xl my-6">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <Image
            src="/logo.png"
            alt="Suryo Agong Logo"
            width={180}
            height={52}
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Buku Tamu Suryo Agong
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-md">
              Silakan isi formulir kehadiran di bawah untuk pendataan kunjungan Anda hari ini.
            </p>
          </div>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-8 text-center shadow-xl backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Data Tamu Terkirim!</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              Terima kasih telah mengisi buku tamu Suryo Agong. Kehadiran Anda telah sukses tercatat dalam sistem kami.
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#BC934B] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#A88444]"
            >
              Isi Buku Tamu Baru
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-sm font-semibold text-red-300">
                {error}
              </div>
            )}

            {/* Status Hello (Role Selection) */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-1.5 text-sm font-bold text-slate-300">
                HELLO! <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer items-center justify-center rounded-xl border p-3.5 text-xs font-bold uppercase tracking-wide transition-all ${
                    formData.status_hello === "AS GUEST (TAMU)"
                      ? "border-[#BC934B] bg-[#BC934B]/10 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-950/80"
                  }`}
                >
                  <input
                    type="radio"
                    name="status_hello"
                    value="AS GUEST (TAMU)"
                    checked={formData.status_hello === "AS GUEST (TAMU)"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status_hello: e.target.value }))
                    }
                    className="sr-only"
                  />
                  AS GUEST (TAMU)
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-center rounded-xl border p-3.5 text-xs font-bold uppercase tracking-wide transition-all ${
                    formData.status_hello === "AS TEAM"
                      ? "border-[#BC934B] bg-[#BC934B]/10 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-950/80"
                  }`}
                >
                  <input
                    type="radio"
                    name="status_hello"
                    value="AS TEAM"
                    checked={formData.status_hello === "AS TEAM"}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status_hello: e.target.value }))
                    }
                    className="sr-only"
                  />
                  AS TEAM
                </label>
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label htmlFor="nama_kamu" className="text-sm font-semibold text-slate-300">
                Nama Lengkap Anda <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="nama_kamu"
                  type="text"
                  required
                  value={formData.nama_kamu}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nama_kamu: e.target.value }))
                  }
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/10"
                />
              </div>
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-1.5">
              <label htmlFor="nomor_telepon" className="text-sm font-semibold text-slate-300">
                Nomor Telepon / WhatsApp <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  id="nomor_telepon"
                  type="tel"
                  required
                  value={formData.nomor_telepon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nomor_telepon: e.target.value }))
                  }
                  placeholder="Contoh: 081234567890"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/10"
                />
              </div>
            </div>

            {/* Asal Instansi */}
            <div className="space-y-1.5">
              <label htmlFor="asal_instansi" className="text-sm font-semibold text-slate-300">
                Asal Instansi / Perusahaan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Building2 className="h-4 w-4" />
                </span>
                <input
                  id="asal_instansi"
                  type="text"
                  value={formData.asal_instansi}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, asal_instansi: e.target.value }))
                  }
                  placeholder="Nama sekolah / universitas / perusahaan Anda"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/10"
                />
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-1.5">
              <label htmlFor="alamat" className="text-sm font-semibold text-slate-300">
                Alamat Domisili
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-0 flex items-center pl-3.5 text-slate-500">
                  <MapPin className="h-4 w-4" />
                </span>
                <textarea
                  id="alamat"
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, alamat: e.target.value }))
                  }
                  placeholder="Masukkan alamat domisili lengkap Anda"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/10 resize-none"
                />
              </div>
            </div>

            {/* Keperluan */}
            <div className="space-y-1.5">
              <label htmlFor="keperluan" className="text-sm font-semibold text-slate-300">
                Keperluan Berkunjung <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-0 flex items-center pl-3.5 text-slate-500">
                  <Briefcase className="h-4 w-4" />
                </span>
                <textarea
                  id="keperluan"
                  required
                  rows={2}
                  value={formData.keperluan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, keperluan: e.target.value }))
                  }
                  placeholder="Tuliskan tujuan / keperluan kedatangan Anda"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/10 resize-none"
                />
              </div>
            </div>

            {/* Tau Suryo Agong Darimana */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Darimana Anda Mengetahui Suryo Agong? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white">
                {[
                  "INSTAGRAM",
                  "REKOMENDASI TEMAN",
                  "WEBSITE",
                  "GOOGLE MAPS",
                  "MEDIA OFFLINE: BROSUR, BILLBOARD, KORAN",
                ].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => handleSourceChange(src)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                      formData.tau_utero_darimana === src && !otherSource
                        ? "border-[#BC934B] bg-[#BC934B]/10 font-bold"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-950/80"
                    }`}
                  >
                    <HelpCircle className="h-4 w-4 text-[#BC934B] shrink-0" />
                    <span className="leading-tight">{src}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleSourceChange("Other")}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition ${
                    otherSource
                      ? "border-[#BC934B] bg-[#BC934B]/10 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-950/80"
                  }`}
                >
                  <HelpCircle className="h-4 w-4 text-[#BC934B] shrink-0" />
                  <span>LAINNYA</span>
                </button>
              </div>

              {otherSource && (
                <div className="mt-2 space-y-1">
                  <input
                    type="text"
                    required
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="Sebutkan sumber lainnya..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#BC934B]"
                  />
                </div>
              )}
            </div>

            {/* Kritik & Saran */}
            <div className="space-y-1.5">
              <label htmlFor="kritik_saran" className="text-sm font-semibold text-slate-300">
                Kritik & Saran
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-0 flex items-center pl-3.5 text-slate-500">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <textarea
                  id="kritik_saran"
                  rows={2.5}
                  value={formData.kritik_saran}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, kritik_saran: e.target.value }))
                  }
                  placeholder="Beri masukan membangun untuk pelayanan kami"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/10 resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-3.5 mt-2 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#A88444] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Kirim Data Kehadiran
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} PT DOA SURYO AGONG. All rights reserved.
        </div>
      </div>
    </div>
  );
}
