import { cookies } from "next/headers";
import ManagementClientLayout from "@/components/layouts/ManagementLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <ManagementClientLayout>{children}</ManagementClientLayout>;
}