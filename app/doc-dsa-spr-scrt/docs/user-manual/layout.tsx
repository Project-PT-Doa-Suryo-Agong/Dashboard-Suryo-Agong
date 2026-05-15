import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Manual Book — Dashboard PT. Doa Suryo Agong",
  description:
    "Panduan penggunaan sistem Dashboard PT. Doa Suryo Agong untuk setiap role pengguna.",
};

export default function UserManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
