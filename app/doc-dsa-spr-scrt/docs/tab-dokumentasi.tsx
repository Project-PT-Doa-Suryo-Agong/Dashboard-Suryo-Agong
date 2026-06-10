"use client";

import { CodeBlock, Table } from "./components";

export default function TabDokumentasi() {
  return (
    <>
      <h1 className="docs-title">Dokumentasi SSO — Dashboard Suryo Agong</h1>

      <div className="docs-banner">
        Dokumentasi teknis sistem autentikasi (SSO) untuk Dashboard PT. Doa Suryo Agong.
        Sistem ini menggunakan <strong>Supabase Auth</strong> dengan arsitektur multi-tenant
        berbasis role dan path-based routing.
      </div>

      {/* ── Arsitektur ───────────────────────────────────────────── */}
      <h2 className="docs-h2">Arsitektur Autentikasi</h2>
      <p className="docs-p">
        Dashboard menggunakan <strong>Supabase Auth</strong> (email + password) sebagai identity provider.
        Setelah login berhasil, session token disimpan di <code className="docs-inline">httpOnly cookie</code> dengan
        domain <code className="docs-inline">localhost</code> (dev) atau <code className="docs-inline">your-domain.com</code> (prod).
      </p>

      <CodeBlock title="Auth Flow">{`Browser ──→ POST /api/auth/login  (email + password)
                │
                ▼
        Supabase Auth  (signInWithPassword)
                │
                ▼
        Resolve role dari:
          1. user_metadata.role
          2. app_metadata.role
          3. core.profiles.role
                │
                ▼
        Map role → dashboard path (/finance, /hr, /produksi, dll)
                │
                ▼
        Set cookies (auth token + role + display_name)
                │
                ▼
        Redirect → /{role-path}  (e.g. /finance)`}</CodeBlock>

      {/* ── Environment ──────────────────────────────────────────── */}
      <h2 className="docs-h2">Environment Variables</h2>
      <CodeBlock title=".env">{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000`}</CodeBlock>

      <Table
        headers={["Variable", "Scope", "Deskripsi"]}
        rows={[
          ["<code>NEXT_PUBLIC_SUPABASE_URL</code>", "Client + Server", "URL project Supabase"],
          ["<code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>", "Client + Server", "Anon key Supabase (public, dibatasi RLS)"],
          ["<code>SUPABASE_SERVICE_ROLE_KEY</code>", "Server only", "Service role key — bypass RLS, <strong>jangan expose ke client</strong>"],
          ["<code>NEXT_PUBLIC_SITE_URL</code>", "Client + Server", "Base URL untuk cookie domain & redirect"],
        ]}
      />

      {/* ── Role Matrix ──────────────────────────────────────────── */}
      <h2 className="docs-h2">Role → Dashboard Path Mapping</h2>
      <p className="docs-p">
        Setelah login, role user di-resolve dari profile database dan di-map ke path dashboard yang sesuai.
      </p>
      <Table
        headers={["Role", "Path", "Access Level"]}
        rows={[
          ["<code>Super-Admin</code>", "<code>/super-admin</code>", '<span class="docs-badge docs-badge-red">Strategic</span>'],
          ["<code>Management</code>", "<code>/management</code>", '<span class="docs-badge docs-badge-red">Strategic</span>'],
          ["<code>Finance</code>", "<code>/finance</code>", '<span class="docs-badge docs-badge-blue">Operational</span>'],
          ["<code>HR</code>", "<code>/hr</code>", '<span class="docs-badge docs-badge-blue">Operational</span>'],
          ["<code>Produksi</code>", "<code>/produksi</code>", '<span class="docs-badge docs-badge-blue">Operational</span>'],
          ["<code>Logistik</code>", "<code>/logistik</code>", '<span class="docs-badge docs-badge-blue">Operational</span>'],
          ["<code>Creative</code>", "<code>/creative</code>", '<span class="docs-badge docs-badge-blue">Operational</span>'],
          ["<code>Office</code>", "<code>/office</code>", '<span class="docs-badge docs-badge-green">Support</span>'],
        ]}
      />

      {/* ── Access Level ─────────────────────────────────────────── */}
      <h2 className="docs-h2">Access Level & Menu per Role</h2>
      <p className="docs-p">
        Setiap role memiliki akses ke cluster menu yang <strong>berbeda-beda</strong> sesuai divisinya.
        Hanya <code className="docs-inline">Super-Admin</code> yang memiliki akses ke <strong>semua</strong> cluster.
      </p>

      <Table
        headers={["Role", "Access Level", "Cluster yang Diakses", "Menu"]}
        rows={[
          [
            "<code>Super-Admin</code>",
            '<span class="docs-badge docs-badge-red">Strategic</span>',
            "cluster_1 — cluster_7",
            "<strong>Semua menu</strong> dari seluruh divisi",
          ],
          [
            "<code>Management</code>",
            '<span class="docs-badge docs-badge-blue">Operational</span>',
            "cluster_1",
            "Overview, Pengajuan Budget Divisi, KPI Divisi",
          ],
          [
            "<code>Finance</code>",
            '<span class="docs-badge docs-badge-blue">Operational</span>',
            "cluster_2",
            "Overview, Cashflow, Payroll, Reimburse, Chart of Accounts, Journal, Invoice, Utang Piutang",
          ],
          [
            "<code>HR</code>",
            '<span class="docs-badge docs-badge-blue">Operational</span>',
            "cluster_3",
            "Overview, Kehadiran, Karyawan, PKWT/PKWTP, Peringatan, SOP",
          ],
          [
            "<code>Produksi</code>",
            '<span class="docs-badge docs-badge-blue">Operational</span>',
            "cluster_4",
            "Overview, Orders, QC Inbound, QC Outbound",
          ],
          [
            "<code>Logistik</code>",
            '<span class="docs-badge docs-badge-blue">Operational</span>',
            "cluster_5",
            "Overview, Manifest, Packing, Returns",
          ],
          [
            "<code>Creative</code>",
            '<span class="docs-badge docs-badge-blue">Operational</span>',
            "cluster_6",
            "Overview, Affiliators, Content Planner, Content Stats, Sales Order",
          ],
          [
            "<code>Office</code>",
            '<span class="docs-badge docs-badge-green">Support</span>',
            "cluster_7",
            "Overview, Product, Vendors",
          ],
        ]}
      />

      <h3 className="docs-h3">Daftar Cluster</h3>
      <Table
        headers={["Cluster", "Nama", "Jumlah Menu"]}
        rows={[
          ["<code>cluster_1</code>", "Management & Strategy", "4 menu"],
          ["<code>cluster_2</code>", "Finance & Administration", "4 menu"],
          ["<code>cluster_3</code>", "HR & Operation Manager", "5 menu"],
          ["<code>cluster_4</code>", "Produksi & Quality Control", "4 menu"],
          ["<code>cluster_5</code>", "Logistics & Packing", "3 menu"],
          ["<code>cluster_6</code>", "Creative & Sales", "5 menu"],
          ["<code>cluster_7</code>", "Office Support", "3 menu"],
        ]}
      />

      <div className="docs-banner" style={{ marginTop: "1rem" }}>
        <strong>Catatan:</strong> Role <code>Super-Admin</code> mendapat akses
        ke semua cluster (cluster_1 — cluster_7). Role operasional hanya mendapat akses ke cluster yang
        relevan dengan divisinya masing-masing.
      </div>

      {/* ── Cookie Strategy ──────────────────────────────────────── */}
      <h2 className="docs-h2">Cookie Strategy</h2>
      <p className="docs-p">
        Sistem menggunakan cookie-based session untuk autentikasi. Semua cookie disimpan pada host yang sama (path-based routing).
      </p>
      <Table
        headers={["Cookie", "Domain", "HttpOnly", "MaxAge", "Deskripsi"]}
        rows={[
          ["<code>sb-*-auth-token</code>", "<code>localhost</code>", "No", "Session", "Supabase auth session (bisa chunked)"],
          ["<code>role</code>", "<code>localhost</code>", "Yes", "30 hari", "Role user untuk routing & guard"],
          ["<code>display_name</code>", "<code>localhost</code>", "No", "30 hari", "Nama tampilan user"],
        ]}
      />
    </>
  );
}
