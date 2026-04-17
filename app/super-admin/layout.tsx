import SuperAdminClientLayout from '@/components/layouts/SuperAdminLayout';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminClientLayout>{children}</SuperAdminClientLayout>;
}