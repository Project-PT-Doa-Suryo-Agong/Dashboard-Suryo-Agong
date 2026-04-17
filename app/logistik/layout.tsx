import { headers } from "next/headers";
import LogistikClientLayout from "@/components/layouts/LogistikLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function LogistikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const role = headerStore.get("x-user-role");

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <LogistikClientLayout>{children}</LogistikClientLayout>;
}