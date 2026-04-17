import { cookies } from "next/headers";
import HRClientLayout from "@/components/layouts/HRLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <HRClientLayout>{children}</HRClientLayout>;
}