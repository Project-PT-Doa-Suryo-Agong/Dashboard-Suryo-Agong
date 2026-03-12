// proxy.ts (sebelumnya middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Ubah nama fungsi dari middleware menjadi proxy
export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  
  // Dapatkan hostname yang diketik user (contoh: "finance.localhost:3000" atau "produksi.perusahaan.com")
  const hostname = req.headers.get('host') || '';

  // Daftar nama folder/subdomain divisi kamu
  const validSubdomains = [
    'creative', 'developer', 'finance', 'hr', 
    'logistik', 'management', 'produksi', 'support'
  ];

  // Ekstrak kata pertama sebelum titik
  const subdomain = hostname.split('.')[0];

  // Jika subdomainnya valid
  if (validSubdomains.includes(subdomain)) {
    // Arahkan (rewrite) secara gaib ke folder yang sesuai
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
  }

  // Jika tidak ada subdomain, biarkan lewat
  return NextResponse.next();
}

// Konfigurasi matcher tetap sama persis
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}