"use client";

import Link from "next/link";
import "./user-manual.css";

const ROLE_CARDS = [
  {
    slug: "super-admin",
    title: "Super Admin",
    description:
      "Akses penuh ke seluruh modul sistem, manajemen user, master data, log aktivitas, dan konfigurasi enterprise.",
    icon: "🛡️",
    accent: "#6366f1",
  },
  {
    slug: "admin",
    title: "Admin",
    description:
      "Mengelola data user, produk, varian, dan vendor. Akses ke seluruh dashboard divisi sebagai kontrol administratif.",
    icon: "⚙️",
    accent: "#8b5cf6",
  },
  {
    slug: "management",
    title: "Management",
    description:
      "Pemantauan budget, KPI lintas divisi, dan pengambilan keputusan strategis perusahaan.",
    icon: "📊",
    accent: "#BC934B",
  },
  {
    slug: "finance",
    title: "Finance",
    description:
      "Monitoring arus kas, payroll, reimbursement, jurnal, CoA, invoice, dan utang piutang perusahaan.",
    icon: "💰",
    accent: "#10b981",
  },
  {
    slug: "hr",
    title: "HR (Human Resources)",
    description:
      "Manajemen karyawan, presensi, PKWT/PKWTP, surat peringatan, dan SOP operasional perusahaan.",
    icon: "👥",
    accent: "#3b82f6",
  },
  {
    slug: "produksi",
    title: "Produksi",
    description:
      "Monitoring pesanan produksi, QC inbound bahan baku, dan QC outbound produk jadi sebelum kirim.",
    icon: "🏭",
    accent: "#f59e0b",
  },
  {
    slug: "logistik",
    title: "Logistik",
    description:
      "Kelola packing, manifest pengiriman, dan penanganan retur barang secara efisien.",
    icon: "🚛",
    accent: "#ef4444",
  },
  {
    slug: "creative",
    title: "Creative & Sales",
    description:
      "Dashboard penjualan, affiliator, content planner, live streaming performance, dan sales order.",
    icon: "🎨",
    accent: "#ec4899",
  },
  {
    slug: "office",
    title: "Office Support",
    description:
      "Administrasi master data vendor, katalog produk, dan dukungan operasional kantor.",
    icon: "🏢",
    accent: "#64748b",
  },
] as const;

export default function UserManualPage() {
  return (
    <div className="um-page">
      {/* ── Top Bar ──────────────────────────────────── */}
      <nav className="um-topbar">
        <div>
          <div className="um-topbar-title">User Manual Book</div>
          <div className="um-topbar-subtitle">
            Dashboard PT. Doa Suryo Agong
          </div>
        </div>
        <div className="um-topbar-actions">
          <Link
            href="/doc-dsa-spr-scrt/docs"
            className="um-btn um-btn-ghost"
          >
            ← Kembali ke Docs
          </Link>
          <button
            className="um-btn um-btn-primary"
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────── */}
      <main className="um-content">
        {/* Hero */}
        <section className="um-hero">
          <h1>User Manual Book</h1>
          <p>
            Panduan lengkap penggunaan Dashboard PT. Doa Suryo Agong untuk
            setiap role dalam sistem. Pilih role Anda untuk melihat panduan
            detail.
          </p>
        </section>

        {/* Info Box */}
        <div className="um-info-box tip" style={{ maxWidth: "52rem", margin: "0 auto 2rem" }}>
          <div className="um-info-box-title">💡 Panduan Penggunaan</div>
          <p>
            Klik pada kartu role di bawah untuk membuka panduan lengkap sesuai
            dengan jabatan Anda. Setiap panduan berisi cara login, navigasi
            menu, fitur-fitur utama, dan tips penggunaan.
          </p>
        </div>

        {/* Role Cards Grid */}
        <section className="um-grid">
          {ROLE_CARDS.map((card) => (
            <Link
              key={card.slug}
              href={`/doc-dsa-spr-scrt/docs/user-manual/${card.slug}`}
              className="um-card"
              style={{ "--card-accent": card.accent } as React.CSSProperties}
            >
              <div className="um-card-icon" style={{ background: card.accent }}>
                {card.icon}
              </div>
              <div className="um-card-title">{card.title}</div>
              <div className="um-card-desc">{card.description}</div>
              <div className="um-card-arrow">
                Baca Panduan →
              </div>
            </Link>
          ))}
        </section>

        {/* General Section: How to Login */}
        <section style={{ marginTop: "3rem", maxWidth: "52rem", marginLeft: "auto", marginRight: "auto" }}>
          <div className="um-section">
            <div className="um-section-title">
              <span className="um-section-num">🔐</span>
              Panduan Umum: Cara Login ke Sistem
            </div>
            <div className="um-steps">
              <div className="um-step">
                <span className="um-step-num">1</span>
                <h4>Buka Halaman Login</h4>
                <p>
                  Akses alamat website sistem melalui browser Anda. Sistem akan
                  mengarahkan ke halaman login secara otomatis apabila Anda
                  belum memiliki sesi aktif.
                </p>
              </div>
              <div className="um-step">
                <span className="um-step-num">2</span>
                <h4>Masukkan Kredensial</h4>
                <p>
                  Isi email dan password yang telah diberikan oleh
                  Administrator. Pastikan penulisan email benar dan perhatikan
                  huruf besar/kecil pada password.
                </p>
              </div>
              <div className="um-step">
                <span className="um-step-num">3</span>
                <h4>Klik Tombol Login</h4>
                <p>
                  Setelah mengisi kredensial, klik tombol <strong>&quot;Login&quot;</strong>.
                  Sistem akan memverifikasi data Anda dan mengarahkan ke
                  dashboard sesuai role yang terdaftar.
                </p>
              </div>
              <div className="um-step">
                <span className="um-step-num">4</span>
                <h4>Dashboard Otomatis</h4>
                <p>
                  Setelah login berhasil, Anda akan langsung diarahkan ke
                  dashboard divisi Anda. Menu sidebar akan menampilkan fitur
                  yang sesuai dengan hak akses role Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Access Level Matrix */}
          <div className="um-section">
            <div className="um-section-title">
              <span className="um-section-num">🔑</span>
              Matriks Hak Akses Role
            </div>
            <div className="um-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Level Akses</th>
                    <th>Role</th>
                    <th>Cakupan Akses</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: "#818cf8", fontWeight: 600 }}>Strategic</td>
                    <td>Super Admin, Admin, Developer, CEO</td>
                    <td>Akses penuh ke seluruh 7 cluster menu</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#BC934B", fontWeight: 600 }}>Managerial</td>
                    <td>Management</td>
                    <td>Akses cluster 2</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#3b82f6", fontWeight: 600 }}>Operational</td>
                    <td>Finance, HR, Produksi, Logistik, Creative</td>
                    <td>Akses cluster 3-6 (sesuai divisi)</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748b", fontWeight: 600 }}>Support</td>
                    <td>Office, Security, Maintenance</td>
                    <td>Akses cluster 7 (Office Support)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Logout */}
          <div className="um-section">
            <div className="um-section-title">
              <span className="um-section-num">🚪</span>
              Cara Logout dari Sistem
            </div>
            <div className="um-steps">
              <div className="um-step">
                <span className="um-step-num">1</span>
                <h4>Klik Tombol Logout</h4>
                <p>
                  Di bagian bawah sidebar (panel navigasi kiri), klik tombol
                  merah bertuliskan <strong>&quot;Logout&quot;</strong>.
                </p>
              </div>
              <div className="um-step">
                <span className="um-step-num">2</span>
                <h4>Konfirmasi Logout</h4>
                <p>
                  Sebuah dialog konfirmasi akan muncul. Klik{" "}
                  <strong>&quot;Logout&quot;</strong> untuk keluar dari sesi, atau{" "}
                  <strong>&quot;Batal&quot;</strong> untuk tetap di halaman saat ini.
                </p>
              </div>
            </div>
          </div>

          <div className="um-info-box warning">
            <div className="um-info-box-title">⚠️ Penting</div>
            <p>
              Selalu logout setelah selesai menggunakan sistem, terutama jika
              Anda mengakses dari perangkat bersama. Hal ini untuk menjaga
              keamanan data perusahaan.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
