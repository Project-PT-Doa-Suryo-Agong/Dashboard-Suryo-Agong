// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  
  // 🚀 KUNCI PERBAIKAN: Abaikan file statis!
  // Jika path mengandung titik (contoh: /icon.png, /logo.svg, /style.css), biarkan lewat!
  if (url.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Dapatkan hostname yang diketik user (contoh: "finance.localhost:3000")
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
    // Hindari double-prefix: jika path sudah diawali /{subdomain}, biarkan lewat
    if (url.pathname.startsWith(`/${subdomain}`)) {
      return NextResponse.next();
    }
    // Arahkan (rewrite) secara gaib ke folder yang sesuai
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
  }

  // Jika tidak ada subdomain, biarkan lewat
  return NextResponse.next();
}

// Konfigurasi matcher tetap sama persis
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|icon.png|logo.svg|style.css).*)',
  ],
}