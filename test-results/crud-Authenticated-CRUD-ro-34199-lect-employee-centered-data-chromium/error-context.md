# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crud.spec.ts >> Authenticated CRUD routes >> hr and finance routes reflect employee-centered data
- Location: tests\e2e\crud.spec.ts:382:9

# Error details

```
Error: apiRequestContext.fetch: read ECONNRESET
Call log:
  - → POST http://lvh.me:3000/api/finance/payroll
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json
    - content-length: 91
    - cookie: sb-mhfdzprxauqfczmtyizg-auth-token=base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpoYkdjaU9pSkZVekkxTmlJc0ltdHBaQ0k2SW1GaVlUZzROV1E1TFRSa056TXRORFkzTXkxaVpETTRMV0ZpTldRM1lXRmxabVF4TVNJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUpvZEhSd2N6b3ZMMjFvWm1SNmNISjRZWFZ4Wm1ONmJYUjVhWHBuTG5OMWNHRmlZWE5sTG1OdkwyRjFkR2d2ZGpFaUxDSnpkV0lpT2lKbU9EQmxaVFUyTkMxaE9HWTVMVFExTkdFdE9UazFOUzAwTm1SaVl6RmpObUkwWWpraUxDSmhkV1FpT2lKaGRYUm9aVzUwYVdOaGRHVmtJaXdpWlhod0lqb3hOemMxTlRReU16STNMQ0pwWVhRaU9qRTNOelUxTXpnM01qY3NJbVZ0WVdsc0lqb2laR1YyUUdkdFlXbHNMbU52YlNJc0luQm9iMjVsSWpvaUlpd2lZWEJ3WDIxbGRHRmtZWFJoSWpwN0luQnliM1pwWkdWeUlqb2laVzFoYVd3aUxDSndjbTkyYVdSbGNuTWlPbHNpWlcxaGFXd2lYWDBzSW5WelpYSmZiV1YwWVdSaGRHRWlPbnNpWlcxaGFXeGZkbVZ5YVdacFpXUWlPblJ5ZFdVc0luSnZiR1VpT2lKRVpYWmxiRzl3WlhJaWZTd2ljbTlzWlNJNkltRjFkR2hsYm5ScFkyRjBaV1FpTENKaFlXd2lPaUpoWVd3eElpd2lZVzF5SWpwYmV5SnRaWFJvYjJRaU9pSndZWE56ZDI5eVpDSXNJblJwYldWemRHRnRjQ0k2TVRjM05UVXpPRGN5TjMxZExDSnpaWE56YVc5dVgybGtJam9pTTJOa1pqaG1PREF0Tm1ZeE55MDBPV1JpTFdFME5Ua3ROamRsTlRKbVlqbGlPV0kySWl3aWFYTmZZVzV2Ym5sdGIzVnpJanBtWVd4elpYMC5KUlNrVUE1alNPb001UklfektVME5IM25lWFIydjkzRlMybjdTd19lT2xMNzYwbFZGcnJTX0FkQm9HSGg3bEFTMm1kNV9CTENoX1hkUkF2dk1NSWs3QSIsInRva2VuX3R5cGUiOiJiZWFyZXIiLCJleHBpcmVzX2luIjozNjAwLCJleHBpcmVzX2F0IjoxNzc1NTQyMzI3LCJyZWZyZXNoX3Rva2VuIjoiN2J6aWEzaGV5ZmVhIiwidXNlciI6eyJpZCI6ImY4MGVlNTY0LWE4ZjktNDU0YS05OTU1LTQ2ZGJjMWM2YjRiOSIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoiZGV2QGdtYWlsLmNvbSIsImVtYWlsX2NvbmZpcm1lZF9hdCI6IjIwMjYtMDQtMDdUMDU6MTI6MDYuNjkyODgxWiIsInBob25lIjoiIiwiY29uZmlybWVkX2F0IjoiMjAyNi0wNC0wN1QwNToxMjowNi42OTI4ODFaIiwibGFzdF9zaWduX2luX2F0IjoiMjAyNi0wNC0wN1QwNToxMjowNy4zMTAyMTI5MzRaIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWUsInJvbGUiOiJEZXZlbG9wZXIifSwiaWRlbnRpdGllcyI6W3siaWRlbnRpdHlfaWQiOiJlZTcxMGFlNC01MTJmLTRkOTMtOGJmMS1jYjI0YjNmYzNlMjMiLCJpZCI6ImY4MGVlNTY0LWE4ZjktNDU0YS05OTU1LTQ2ZGJjMWM2YjRiOSIsInVzZXJfaWQiOiJmODBlZTU2NC1hOGY5LTQ1NGEtOTk1NS00NmRiYzFjNmI0YjkiLCJpZGVudGl0eV9kYXRhIjp7ImVtYWlsIjoiZGV2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJmODBlZTU2NC1hOGY5LTQ1NGEtOTk1NS00NmRiYzFjNmI0YjkifSwicHJvdmlkZXIiOiJlbWFpbCIsImxhc3Rfc2lnbl9pbl9hdCI6IjIwMjYtMDMtMzFUMDE6NTc6MTUuMTc4MjEyWiIsImNyZWF0ZWRfYXQiOiIyMDI2LTAzLTMxVDAxOjU3OjE1LjE3ODY4MloiLCJ1cGRhdGVkX2F0IjoiMjAyNi0wMy0zMVQwMTo1NzoxNS4xNzg2ODJaIiwiZW1haWwiOiJkZXZAZ21haWwuY29tIn1dLCJjcmVhdGVkX2F0IjoiMjAyNi0wMy0zMVQwMTo1NzoxNS4xNjkyNDlaIiwidXBkYXRlZF9hdCI6IjIwMjYtMDQtMDdUMDU6MTI6MDcuMzE1N1oiLCJpc19hbm9ueW1vdXMiOmZhbHNlfSwid2Vha19wYXNzd29yZCI6eyJtZXNzYWdlIjoiUGFzc3dvcmQgc2hvdWxkIGJlIGF0IGxlYXN0IDYgY2hhcmFjdGVycy4iLCJyZWFzb25zIjpbImxlbmd0aCJdfX0; __next_hmr_refresh_hash__=b24a25c0327ec53ecbd47eba65e10811633457081244afec

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]:
            - img "logo" [ref=e7]
            - paragraph [ref=e8]: Logistics Portal
          - navigation [ref=e9]:
            - link "Dashboard Overview" [ref=e11] [cursor=pointer]:
              - /url: /logistik
              - img [ref=e12]
              - generic [ref=e17]: Dashboard Overview
            - link "Manifest" [ref=e19] [cursor=pointer]:
              - /url: /manifest
              - img [ref=e20]
              - generic [ref=e25]: Manifest
            - link "Packing" [ref=e27] [cursor=pointer]:
              - /url: /packing
              - img [ref=e28]
              - generic [ref=e32]: Packing
            - link "Returns" [ref=e34] [cursor=pointer]:
              - /url: /returns
              - img [ref=e35]
              - generic [ref=e38]: Returns
        - button "Logout" [ref=e40]:
          - img [ref=e41]
          - generic [ref=e44]: Logout
    - main [ref=e45]:
      - generic [ref=e46]:
        - heading "Logistics Dashboard" [level=2] [ref=e48]
        - generic [ref=e50]:
          - generic [ref=e51]:
            - paragraph [ref=e52]: Budi Dermawan
            - paragraph [ref=e53]: Management & Strategy
          - generic [ref=e55]: BD
      - generic [ref=e57]:
        - generic [ref=e58]:
          - heading "Manifest Pengiriman" [level=1] [ref=e59]
          - paragraph [ref=e60]: Kelola daftar pengiriman barang dan referensi order produksi.
        - generic [ref=e61]:
          - generic [ref=e62]:
            - img [ref=e63]
            - textbox "Cari order / produk / resi..." [ref=e66]
          - generic [ref=e67]:
            - button "Export ke Excel" [ref=e68]
            - button "Tambah Manifest" [ref=e69]:
              - img [ref=e70]
              - text: Tambah Manifest
        - table [ref=e72]:
          - rowgroup [ref=e73]:
            - row "ID Manifest Order Produk Resi Dibuat Aksi" [ref=e74]:
              - columnheader "ID Manifest" [ref=e75]
              - columnheader "Order" [ref=e76]
              - columnheader "Produk" [ref=e77]
              - columnheader "Resi" [ref=e78]
              - columnheader "Dibuat" [ref=e79]
              - columnheader "Aksi" [ref=e80]
          - rowgroup [ref=e81]:
            - row "37D86EF5 28b4d985-e90f-4fa1-b9a0-d74291b76d7a Produk tidak ditemukan RESI-OPS-MNO45PWN-ZIS5C 07 Apr 2026, 11.23 Edit Hapus" [ref=e82]:
              - cell "37D86EF5" [ref=e83]
              - cell "28b4d985-e90f-4fa1-b9a0-d74291b76d7a" [ref=e84]
              - cell "Produk tidak ditemukan" [ref=e85]
              - cell "RESI-OPS-MNO45PWN-ZIS5C" [ref=e86]
              - cell "07 Apr 2026, 11.23" [ref=e87]
              - cell "Edit Hapus" [ref=e88]:
                - generic [ref=e89]:
                  - button "Edit" [ref=e90]:
                    - img [ref=e91]
                    - text: Edit
                  - button "Hapus" [ref=e96]:
                    - img [ref=e97]
                    - text: Hapus
            - row "D06FBE4E 7d3e1400-82a4-4144-ab39-56860d13d926 Produk tidak ditemukan RESI-OPS-MNO438XB-E1QGQ 07 Apr 2026, 11.21 Edit Hapus" [ref=e100]:
              - cell "D06FBE4E" [ref=e101]
              - cell "7d3e1400-82a4-4144-ab39-56860d13d926" [ref=e102]
              - cell "Produk tidak ditemukan" [ref=e103]
              - cell "RESI-OPS-MNO438XB-E1QGQ" [ref=e104]
              - cell "07 Apr 2026, 11.21" [ref=e105]
              - cell "Edit Hapus" [ref=e106]:
                - generic [ref=e107]:
                  - button "Edit" [ref=e108]:
                    - img [ref=e109]
                    - text: Edit
                  - button "Hapus" [ref=e114]:
                    - img [ref=e115]
                    - text: Hapus
            - row "E58FDC46 0b3639a2-f9e6-4561-86af-7f329afee07c Produk tidak ditemukan RESI-XYZ-004 31 Mar 2026, 08.50 Edit Hapus" [ref=e118]:
              - cell "E58FDC46" [ref=e119]
              - cell "0b3639a2-f9e6-4561-86af-7f329afee07c" [ref=e120]
              - cell "Produk tidak ditemukan" [ref=e121]
              - cell "RESI-XYZ-004" [ref=e122]
              - cell "31 Mar 2026, 08.50" [ref=e123]
              - cell "Edit Hapus" [ref=e124]:
                - generic [ref=e125]:
                  - button "Edit" [ref=e126]:
                    - img [ref=e127]
                    - text: Edit
                  - button "Hapus" [ref=e132]:
                    - img [ref=e133]
                    - text: Hapus
            - row "515AD233 c2e42eec-2a40-4d1d-b550-8122e9fcae87 Produk tidak ditemukan RESI-XYZ-005 31 Mar 2026, 08.50 Edit Hapus" [ref=e136]:
              - cell "515AD233" [ref=e137]
              - cell "c2e42eec-2a40-4d1d-b550-8122e9fcae87" [ref=e138]
              - cell "Produk tidak ditemukan" [ref=e139]
              - cell "RESI-XYZ-005" [ref=e140]
              - cell "31 Mar 2026, 08.50" [ref=e141]
              - cell "Edit Hapus" [ref=e142]:
                - generic [ref=e143]:
                  - button "Edit" [ref=e144]:
                    - img [ref=e145]
                    - text: Edit
                  - button "Hapus" [ref=e150]:
                    - img [ref=e151]
                    - text: Hapus
            - row "E919F7BA ea313563-afcf-4438-8241-425c751b6520 Produk tidak ditemukan RESI-XYZ-006 31 Mar 2026, 08.50 Edit Hapus" [ref=e154]:
              - cell "E919F7BA" [ref=e155]
              - cell "ea313563-afcf-4438-8241-425c751b6520" [ref=e156]
              - cell "Produk tidak ditemukan" [ref=e157]
              - cell "RESI-XYZ-006" [ref=e158]
              - cell "31 Mar 2026, 08.50" [ref=e159]
              - cell "Edit Hapus" [ref=e160]:
                - generic [ref=e161]:
                  - button "Edit" [ref=e162]:
                    - img [ref=e163]
                    - text: Edit
                  - button "Hapus" [ref=e168]:
                    - img [ref=e169]
                    - text: Hapus
            - row "5F2151E1 f30e9202-3afd-4387-83be-18e9b5deb89b Produk tidak ditemukan RESI-XYZ-001 31 Mar 2026, 08.50 Edit Hapus" [ref=e172]:
              - cell "5F2151E1" [ref=e173]
              - cell "f30e9202-3afd-4387-83be-18e9b5deb89b" [ref=e174]
              - cell "Produk tidak ditemukan" [ref=e175]
              - cell "RESI-XYZ-001" [ref=e176]
              - cell "31 Mar 2026, 08.50" [ref=e177]
              - cell "Edit Hapus" [ref=e178]:
                - generic [ref=e179]:
                  - button "Edit" [ref=e180]:
                    - img [ref=e181]
                    - text: Edit
                  - button "Hapus" [ref=e186]:
                    - img [ref=e187]
                    - text: Hapus
            - row "C8C3097C 4966e67a-e0aa-4753-bcf0-c3631bff0c59 Produk tidak ditemukan RESI-XYZ-008 31 Mar 2026, 08.50 Edit Hapus" [ref=e190]:
              - cell "C8C3097C" [ref=e191]
              - cell "4966e67a-e0aa-4753-bcf0-c3631bff0c59" [ref=e192]
              - cell "Produk tidak ditemukan" [ref=e193]
              - cell "RESI-XYZ-008" [ref=e194]
              - cell "31 Mar 2026, 08.50" [ref=e195]
              - cell "Edit Hapus" [ref=e196]:
                - generic [ref=e197]:
                  - button "Edit" [ref=e198]:
                    - img [ref=e199]
                    - text: Edit
                  - button "Hapus" [ref=e204]:
                    - img [ref=e205]
                    - text: Hapus
            - row "1ED50FF0 39fe97d8-c076-4583-b980-72f8dd81709b Produk tidak ditemukan RESI-XYZ-009 31 Mar 2026, 08.50 Edit Hapus" [ref=e208]:
              - cell "1ED50FF0" [ref=e209]
              - cell "39fe97d8-c076-4583-b980-72f8dd81709b" [ref=e210]
              - cell "Produk tidak ditemukan" [ref=e211]
              - cell "RESI-XYZ-009" [ref=e212]
              - cell "31 Mar 2026, 08.50" [ref=e213]
              - cell "Edit Hapus" [ref=e214]:
                - generic [ref=e215]:
                  - button "Edit" [ref=e216]:
                    - img [ref=e217]
                    - text: Edit
                  - button "Hapus" [ref=e222]:
                    - img [ref=e223]
                    - text: Hapus
            - row "57E4FCD2 e8ea32cd-afa5-48d5-8d8f-492e536b58be Produk tidak ditemukan RESI-XYZ-007 31 Mar 2026, 08.50 Edit Hapus" [ref=e226]:
              - cell "57E4FCD2" [ref=e227]
              - cell "e8ea32cd-afa5-48d5-8d8f-492e536b58be" [ref=e228]
              - cell "Produk tidak ditemukan" [ref=e229]
              - cell "RESI-XYZ-007" [ref=e230]
              - cell "31 Mar 2026, 08.50" [ref=e231]
              - cell "Edit Hapus" [ref=e232]:
                - generic [ref=e233]:
                  - button "Edit" [ref=e234]:
                    - img [ref=e235]
                    - text: Edit
                  - button "Hapus" [ref=e240]:
                    - img [ref=e241]
                    - text: Hapus
            - row "25581251 ea8a3380-6cee-4796-b4b1-4963e9fa5dbb Produk tidak ditemukan RESI-XYZ-002 31 Mar 2026, 08.50 Edit Hapus" [ref=e244]:
              - cell "25581251" [ref=e245]
              - cell "ea8a3380-6cee-4796-b4b1-4963e9fa5dbb" [ref=e246]
              - cell "Produk tidak ditemukan" [ref=e247]
              - cell "RESI-XYZ-002" [ref=e248]
              - cell "31 Mar 2026, 08.50" [ref=e249]
              - cell "Edit Hapus" [ref=e250]:
                - generic [ref=e251]:
                  - button "Edit" [ref=e252]:
                    - img [ref=e253]
                    - text: Edit
                  - button "Hapus" [ref=e258]:
                    - img [ref=e259]
                    - text: Hapus
  - button "Open Next.js Dev Tools" [ref=e267] [cursor=pointer]:
    - img [ref=e268]
  - alert [ref=e271]
```

# Test source

```ts
  30  |         const trimmed = line.trim();
  31  |         if (!trimmed || trimmed.startsWith("#")) continue;
  32  | 
  33  |         const separatorIndex = trimmed.indexOf("=");
  34  |         if (separatorIndex < 0) continue;
  35  | 
  36  |         const key = trimmed.slice(0, separatorIndex).trim();
  37  |         let value = trimmed.slice(separatorIndex + 1).trim();
  38  | 
  39  |         if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
  40  |             value = value.slice(1, -1);
  41  |         }
  42  | 
  43  |         variables[key] = value;
  44  |     }
  45  | 
  46  |     return variables;
  47  | }
  48  | 
  49  | export function getEnv(): EnvVars {
  50  |     const repoRoot = process.cwd();
  51  |     const fileEnv = parseEnvFile(path.join(repoRoot, ".env.local"));
  52  | 
  53  |     return {
  54  |         NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
  55  |         NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  56  |         SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY ?? "",
  57  |         NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? fileEnv.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL,
  58  |     };
  59  | }
  60  | 
  61  | export function getBaseUrl() {
  62  |     return getEnv().NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  63  | }
  64  | 
  65  | export function getAdminClient() {
  66  |     const env = getEnv();
  67  |     if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  68  |         throw new Error("Missing Supabase environment variables for test setup.");
  69  |     }
  70  | 
  71  |     return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  72  |         auth: {
  73  |             autoRefreshToken: false,
  74  |             persistSession: false,
  75  |         },
  76  |     });
  77  | }
  78  | 
  79  | export function uniqueTag(prefix: string) {
  80  |     return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  81  | }
  82  | 
  83  | export async function ensureSeedUser(user: SeedUser) {
  84  |     const supabase = getAdminClient();
  85  |     const { data: usersResult, error: listError } = await supabase.auth.admin.listUsers({
  86  |         page: 1,
  87  |         perPage: 1000,
  88  |     });
  89  | 
  90  |     if (listError) {
  91  |         throw listError;
  92  |     }
  93  | 
  94  |     const existingUser = usersResult.users.find((item) => item.email === user.email);
  95  |     let userId = existingUser?.id;
  96  | 
  97  |     if (!userId) {
  98  |         const { data, error } = await supabase.auth.admin.createUser({
  99  |             email: user.email,
  100 |             password: user.password,
  101 |             email_confirm: true,
  102 |             user_metadata: { role: user.role },
  103 |         });
  104 | 
  105 |         if (error || !data.user) {
  106 |             throw error ?? new Error(`Unable to create test user ${user.email}.`);
  107 |         }
  108 | 
  109 |         userId = data.user.id;
  110 |     } else {
  111 |         const { error } = await supabase.auth.admin.updateUserById(userId, {
  112 |             email_confirm: true,
  113 |             user_metadata: { role: user.role },
  114 |         });
  115 | 
  116 |         if (error) {
  117 |             throw error;
  118 |         }
  119 |     }
  120 | 
  121 |     return userId;
  122 | }
  123 | 
  124 | export async function apiJson<T>(
  125 |     page: Page,
  126 |     method: "GET" | "POST" | "PATCH" | "DELETE",
  127 |     pathName: string,
  128 |     body?: unknown,
  129 | ): Promise<T> {
> 130 |     const response = await page.request.fetch(pathName, {
      |                                         ^ Error: apiRequestContext.fetch: read ECONNRESET
  131 |         method,
  132 |         headers: {
  133 |             "Content-Type": "application/json",
  134 |         },
  135 |         data: body,
  136 |     });
  137 | 
  138 |     const text = await response.text();
  139 |     let payload: { success?: boolean; data?: T; error?: { message?: string; details?: unknown } };
  140 | 
  141 |     try {
  142 |         payload = JSON.parse(text) as { success?: boolean; data?: T; error?: { message?: string; details?: unknown } };
  143 |     } catch {
  144 |         throw new Error(text || `Request failed: ${method} ${pathName}`);
  145 |     }
  146 | 
  147 |     if (!response.ok || payload.success === false) {
  148 |         const detailText = payload.error?.details ? ` | details: ${JSON.stringify(payload.error.details)}` : "";
  149 |         throw new Error(`${(payload.error?.message ?? text) || `Request failed: ${method} ${pathName}`}${detailText}`);
  150 |     }
  151 | 
  152 |     return payload.data as T;
  153 | }
  154 | 
  155 | export async function loginWithUi(page: Page, user: SeedUser) {
  156 |     const env = getEnv();
  157 |     if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  158 |         throw new Error("Missing Supabase environment variables for browser auth seeding.");
  159 |     }
  160 | 
  161 |     const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  162 |         auth: {
  163 |             autoRefreshToken: false,
  164 |             persistSession: false,
  165 |         },
  166 |     });
  167 | 
  168 |     const { data, error } = await supabase.auth.signInWithPassword({
  169 |         email: user.email,
  170 |         password: user.password,
  171 |     });
  172 | 
  173 |     if (error || !data.session) {
  174 |         throw error ?? new Error(`Unable to authenticate test user ${user.email}.`);
  175 |     }
  176 | 
  177 |     const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  178 |     const cookieName = `sb-${projectRef}-auth-token`;
  179 |     const cookieValue = `base64-${Buffer.from(JSON.stringify(data.session), "utf8").toString("base64url")}`;
  180 | 
  181 |     await page.context().addCookies([
  182 |         {
  183 |             name: cookieName,
  184 |             value: cookieValue,
  185 |             domain: ".lvh.me",
  186 |             path: "/",
  187 |             sameSite: "Lax",
  188 |             secure: false,
  189 |             httpOnly: false,
  190 |         },
  191 |     ]);
  192 | }
  193 | 
  194 | export async function openRoute(page: Page, routePath: string) {
  195 |     const baseUrl = getBaseUrl().replace(/\/$/, "");
  196 |     await page.goto(`${baseUrl}${routePath}`, { waitUntil: "domcontentloaded" });
  197 | }
  198 | 
```