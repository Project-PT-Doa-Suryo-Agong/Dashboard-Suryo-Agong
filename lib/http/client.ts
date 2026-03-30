export async function fetchApi<T>(endpoint: string, options?: RequestInit) {
  // Semua request diarahkan ke API internal di aplikasi Frontend yang sudah digabung.
  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    // Kirim cookie sesi saat memanggil API internal.
    credentials: "include",
  });

  const json = await res.json();
  
  if (!json.success) {
    throw new Error(json.error?.message || "Terjadi kesalahan pada internal server");
  }

  return json.data as T;
}
