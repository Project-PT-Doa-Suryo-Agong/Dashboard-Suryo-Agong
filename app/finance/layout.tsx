import { cookies } from "next/headers";
import FinanceClientLayout from "@/components/layouts/FinanceLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <FinanceClientLayout>{children}</FinanceClientLayout>;
}