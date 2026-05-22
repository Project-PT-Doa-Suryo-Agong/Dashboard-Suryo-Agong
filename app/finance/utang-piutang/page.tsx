"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyUtangPiutangRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/finance/utang");
  }, [router]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center text-slate-400 text-sm">
      Mengalihkan ke Catatan Utang...
    </div>
  );
}
