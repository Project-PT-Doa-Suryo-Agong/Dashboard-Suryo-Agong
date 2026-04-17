import { cookies } from "next/headers";
import OfficeClientLayout from "@/components/layouts/OfficeLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <OfficeClientLayout>{children}</OfficeClientLayout>;
}