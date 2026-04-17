import { cookies } from "next/headers";
import ProduksiClientLayout from "@/components/layouts/ProduksiLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function ProduksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <ProduksiClientLayout>{children}</ProduksiClientLayout>;
}
