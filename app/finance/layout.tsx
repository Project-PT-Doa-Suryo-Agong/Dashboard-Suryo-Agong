import { headers } from "next/headers";
import FinanceClientLayout from "@/components/layouts/FinanceLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const role = headerStore.get("x-user-role");

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <FinanceClientLayout>{children}</FinanceClientLayout>;
}