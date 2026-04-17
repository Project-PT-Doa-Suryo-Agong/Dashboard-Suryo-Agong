import { cookies } from "next/headers";
import LogistikClientLayout from "@/components/layouts/LogistikLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function LogistikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <LogistikClientLayout>{children}</LogistikClientLayout>;
}