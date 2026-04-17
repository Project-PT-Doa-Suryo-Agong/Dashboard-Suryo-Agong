import { headers } from "next/headers";
import HRClientLayout from "@/components/layouts/HRLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const role = headerStore.get("x-user-role");

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <HRClientLayout>{children}</HRClientLayout>;
}