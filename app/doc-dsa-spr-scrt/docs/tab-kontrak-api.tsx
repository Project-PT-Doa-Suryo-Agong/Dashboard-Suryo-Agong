"use client";

import { CodeBlock, Table, MethodBadge } from "./components";

export default function TabKontrakApi() {
  return (
    <>
      <h1 className="docs-title">Kontrak API Autentikasi — Endpoint Reference</h1>

      <div className="docs-banner">
        Dokumentasi endpoint API autentikasi dan akses kontrol untuk Dashboard PT. Doa Suryo Agong.
        Semua endpoint menggunakan format response standar <code className="docs-inline">ApiSuccess</code> / <code className="docs-inline">ApiError</code>.
      </div>

      {/* ── Format Response ──────────────────────────────────────── */}
      <h2 className="docs-h2">Format Response Standar</h2>
      <h3 className="docs-h3">Success Response</h3>
      <CodeBlock title="HTTP/1.1 200 OK — Content-Type: application/json">{`{
  "ok": true,
  "success": true,
  "data": { ... },
  "message": "Pesan opsional"
}`}</CodeBlock>

      <h3 className="docs-h3">Error Response</h3>
      <CodeBlock title="HTTP/1.1 4xx/5xx — Content-Type: application/json">{`{
  "ok": false,
  "success": false,
  "data": null,
  "message": "Pesan error yang deskriptif",
  "errorCode": "UNAUTHORIZED",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Sesi tidak valid atau belum login.",
    "details": "..." 
  }
}`}</CodeBlock>

      <h3 className="docs-h3">Error Codes</h3>
      <Table
        headers={["Error Code", "HTTP Status", "Keterangan"]}
        rows={[
          ["<code>UNAUTHORIZED</code>", "401", "Belum login atau session expired"],
          ["<code>FORBIDDEN</code>", "403", "Tidak punya akses ke resource"],
          ["<code>VALIDATION_ERROR</code>", "400", "Input tidak valid"],
          ["<code>INVALID_JSON</code>", "400", "Body request bukan JSON valid"],
          ["<code>NOT_FOUND</code>", "404", "Resource tidak ditemukan"],
          ["<code>INTERNAL_ERROR</code>", "500", "Kesalahan server internal"],
        ]}
      />

      {/* ── Login ────────────────────────────────────────────────── */}
      <h2 className="docs-h2">1. Login</h2>
      <p className="docs-p"><MethodBadge method="POST" /> <code className="docs-inline">/api/auth/login</code></p>
      <p className="docs-p">Autentikasi user dengan email dan password. Mengembalikan redirect URL berdasarkan role.</p>

      <h3 className="docs-h3">Request Body</h3>
      <CodeBlock title="POST /api/auth/login">{`{
  "email": "user@suryoagong.com",
  "password": "your-password"
}`}</CodeBlock>

      <Table
        headers={["Field", "Type", "Wajib", "Keterangan"]}
        rows={[
          ["<code>email</code>", "string", "Ya", "Email terdaftar di Supabase Auth"],
          ["<code>password</code>", "string", "Ya", "Password akun"],
        ]}
      />

      <h3 className="docs-h3">Success Response</h3>
      <CodeBlock title="200 OK">{`{
  "ok": true,
  "success": true,
  "data": {
    "redirectUrl": "http://localhost:3000/finance"
  },
  "message": "Login berhasil."
}`}</CodeBlock>

      <h3 className="docs-h3">Cookies yang Di-set</h3>
      <p className="docs-p">Setelah login berhasil, server akan men-set cookies berikut:</p>
      <Table
        headers={["Cookie", "Keterangan"]}
        rows={[
          ["<code>sb-*-auth-token</code>", "Session token Supabase (bisa chunked menjadi beberapa cookie)"],
          ["<code>role</code>", "Role user (httpOnly, 30 hari)"],
          ["<code>display_name</code>", "Nama tampilan user (30 hari)"],
        ]}
      />

      {/* ── Logout ───────────────────────────────────────────────── */}
      <h2 className="docs-h2">2. Logout</h2>
      <p className="docs-p"><MethodBadge method="POST" /> <code className="docs-inline">/api/auth/logout</code></p>
      <p className="docs-p">Logout user dan hapus semua auth cookies (termasuk chunked cookies).</p>

      <h3 className="docs-h3">Success Response</h3>
      <CodeBlock title="200 OK">{`{
  "ok": true,
  "success": true,
  "data": null,
  "message": "Logout berhasil."
}`}</CodeBlock>

      {/* ── Auth Me ──────────────────────────────────────────────── */}
      <h2 className="docs-h2">3. Auth Me — Cek Session</h2>
      <p className="docs-p"><MethodBadge method="GET" /> <code className="docs-inline">/api/auth/me</code></p>
      <p className="docs-p">Mendapatkan informasi user yang sedang login, termasuk role dan access level.</p>

      <h3 className="docs-h3">Success Response</h3>
      <CodeBlock title="200 OK">{`{
  "ok": true,
  "success": true,
  "data": {
    "id": "uuid-user-id",
    "email": "finance@suryoagong.com",
    "role": "authenticated",
    "profileRole": "Finance",
    "division": null,
    "accessLevel": "operational",
    "jabatan": "Finance"
  },
  "message": null
}`}</CodeBlock>

      <Table
        headers={["Field", "Type", "Keterangan"]}
        rows={[
          ["<code>id</code>", "string", "UUID user dari Supabase Auth"],
          ["<code>email</code>", "string", "Email user"],
          ["<code>profileRole</code>", "string | null", "Role dari tabel <code>core.profiles</code>"],
          ["<code>accessLevel</code>", "string", "Level akses: strategic / managerial / operational / support"],
          ["<code>jabatan</code>", "string", "Jabatan yang di-resolve dari role/profile"],
        ]}
      />

      {/* ── Access Catalog ───────────────────────────────────────── */}
      <h2 className="docs-h2">4. Access Catalog</h2>
      <p className="docs-p"><MethodBadge method="GET" /> <code className="docs-inline">/api/access/catalog</code></p>
      <p className="docs-p">Mendapatkan daftar semua menu cluster dan mapping level → cluster.</p>

      <h3 className="docs-h3">Success Response</h3>
      <CodeBlock title="200 OK">{`{
  "ok": true,
  "success": true,
  "data": {
    "levels": {
      "strategic": ["cluster_1", "cluster_2", ...],
      "operational": ["cluster_2", "cluster_3", ...],
      "support": ["cluster_7"]
    },
    "clusters": [
      {
        "key": "cluster_1",
        "title": "Dashboard",
        "menus": [{ "key": "dashboard", "title": "Dashboard" }]
      }
    ]
  }
}`}</CodeBlock>

      {/* ── Access Check ─────────────────────────────────────────── */}
      <h2 className="docs-h2">5. Access Check</h2>
      <p className="docs-p"><MethodBadge method="GET" /> <code className="docs-inline">/api/access/check?cluster=cluster_2&amp;menu=finance</code></p>
      <p className="docs-p">Cek apakah user yang sedang login memiliki akses ke cluster/menu tertentu. Minimal salah satu query parameter wajib diisi.</p>

      <Table
        headers={["Query Param", "Type", "Keterangan"]}
        rows={[
          ["<code>cluster</code>", "string", "Key cluster yang ingin dicek (opsional)"],
          ["<code>menu</code>", "string", "Key menu yang ingin dicek (opsional)"],
        ]}
      />

      <h3 className="docs-h3">Success Response</h3>
      <CodeBlock title="200 OK">{`{
  "ok": true,
  "success": true,
  "data": {
    "level": "operational",
    "jabatan": "Finance",
    "cluster": "cluster_2",
    "menu": "finance",
    "allowed": {
      "cluster": true,
      "menu": true,
      "all": true
    }
  }
}`}</CodeBlock>

      {/* ── Access Me ────────────────────────────────────────────── */}
      <h2 className="docs-h2">6. Access Me — Summary</h2>
      <p className="docs-p"><MethodBadge method="GET" /> <code className="docs-inline">/api/access/me</code></p>
      <p className="docs-p">Gabungan auth + profile + access summary. Mengembalikan semua cluster yang bisa diakses user.</p>

      <h3 className="docs-h3">Success Response</h3>
      <CodeBlock title="200 OK">{`{
  "ok": true,
  "success": true,
  "data": {
    "userId": "uuid-user-id",
    "role": "Finance",
    "access": {
      "level": "operational",
      "jabatan": "Finance",
      "division": null,
      "clusters": [
        { "key": "cluster_2", "title": "...", "menus": [...] },
        { "key": "cluster_3", "title": "...", "menus": [...] }
      ]
    }
  }
}`}</CodeBlock>

      {/* ── CORS ─────────────────────────────────────────────────── */}
      <h2 className="docs-h2">CORS — Allowed Origins</h2>
      <p className="docs-p">
        Endpoint login mendukung CORS untuk request cross-origin.
        Berikut daftar origin yang diizinkan:
      </p>
      <Table
        headers={["Domain", "Keterangan"]}
        rows={[
          ["<code>http://localhost:3000</code>", "Development (direct)"],
          ["<code>*.vercel.app</code>", "Vercel preview & production"],
        ]}
      />
      <p className="docs-p">
        Selain daftar di atas, origin yang cocok dengan <code className="docs-inline">NEXT_PUBLIC_SITE_URL</code>
        juga otomatis diizinkan.
      </p>
    </>
  );
}
