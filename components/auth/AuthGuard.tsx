"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { Loader2 } from "lucide-react";

type AuthGuardProps = {
  children: React.ReactNode;
  /** If specified, only these roles can access */
  allowedRoles?: string[];
  /** Redirect URL when not authenticated */
  loginUrl?: string;
  /** Redirect URL when role is forbidden */
  forbiddenUrl?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
};

/**
 * Client-side component that protects pages requiring authentication.
 *
 * @example
 * // Protect a page — any authenticated user
 * <AuthGuard>
 *   <DashboardPage />
 * </AuthGuard>
 *
 * @example
 * // Protect a page — only specific roles
 * <AuthGuard allowedRoles={["Developer", "CEO", "Finance"]}>
 *   <FinancePage />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  allowedRoles,
  loginUrl = "/auth",
  forbiddenUrl,
  loadingComponent,
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → redirect to login
    if (!user) {
      router.replace(loginUrl);
      return;
    }

    // Role check
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user.profile?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        if (forbiddenUrl) {
          router.replace(forbiddenUrl);
        } else {
          // Default: go back to login with error
          router.replace(`${loginUrl}?error=forbidden`);
        }
      }
    }
  }, [user, loading, allowedRoles, loginUrl, forbiddenUrl, router]);

  // Still loading auth state
  if (loading) {
    return (
      loadingComponent ?? (
        <div className="flex min-h-screen items-center justify-center bg-[#999999]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#BC934B]" />
            <p className="text-sm text-white/80">Memverifikasi akses...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Role check failed (will redirect)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.profile?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}
