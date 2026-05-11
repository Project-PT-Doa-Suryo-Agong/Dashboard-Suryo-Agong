import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokumentasi — Dashboard Suryo Agong",
  description:
    "Dokumentasi teknis sistem autentikasi, API, dan integrasi Dashboard PT. Doa Suryo Agong.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
