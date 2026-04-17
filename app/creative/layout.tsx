import { cookies } from "next/headers";
import CreativeClientLayout from "@/components/layouts/CreativeLayout";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default async function CreativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role === "super-admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <CreativeClientLayout>{children}</CreativeClientLayout>;
}