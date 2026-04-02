import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Akses Ditolak</h1>
        <p className="mt-3 text-sm text-slate-600">
          Role akun Anda tidak memiliki izin untuk mengakses subdomain ini.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-[#BC934B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A88444]"
        >
          Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}
