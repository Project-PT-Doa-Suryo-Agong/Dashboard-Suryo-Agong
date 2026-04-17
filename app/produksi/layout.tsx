import { headers } from "next/headers";
import ProduksiClientLayout from "@/components/layouts/ProduksiLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function ProduksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const role = headerStore.get("x-user-role");

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <ProduksiClientLayout>{children}</ProduksiClientLayout>;
}
