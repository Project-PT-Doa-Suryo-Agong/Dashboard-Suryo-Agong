type ApiFetchOptions = RequestInit & {
  retryOnAuth?: boolean;
  authRetryDelayMs?: number;
  suppressAuthRedirect?: boolean;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch(url: string, options?: ApiFetchOptions): Promise<Response> {
  const {
    retryOnAuth = true,
    authRetryDelayMs = 500,
    suppressAuthRedirect = false,
    ...requestInit
  } = options ?? {};

  const init: RequestInit = {
    ...requestInit,
    credentials: requestInit.credentials ?? "include",
  };

  let response = await fetch(url, init);

  // First-load auth race protection: retry once before deciding session is invalid.
  if (response.status === 401 && retryOnAuth && typeof window !== "undefined") {
    await delay(authRetryDelayMs);
    response = await fetch(url, init);
  }

  if (response.status === 401 && typeof window !== "undefined" && !suppressAuthRedirect) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://lvh.me:3000";
    const base = siteUrl.replace(/\/$/, "");
    const loginUrl = `${base}/auth/login?message=Sesi+telah+berakhir,+silakan+login+kembali`;

    // Avoid noisy reload loops when already on login screen.
    if (!window.location.pathname.startsWith("/auth/login")) {
      window.location.href = loginUrl;
    }
  }

  return response;
}
