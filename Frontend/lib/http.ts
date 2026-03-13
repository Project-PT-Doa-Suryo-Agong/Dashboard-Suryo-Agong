export async function fetchApi<T>(endpoint: string, options?: RequestInit) {
  // Semua request /api/... akan diproxy oleh Next.js dari Frontend ke Backend.
  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    // Pastikan cookie auth selalu terkirim ke server
    credentials: "omit", // browser will use same-origin cookies since it is rewrite
  });

  const json = await res.json();
  
  if (!json.success) {
    throw new Error(json.error?.message || "Terjadi kesalahan pada internal server");
  }

  return json.data as T;
}
