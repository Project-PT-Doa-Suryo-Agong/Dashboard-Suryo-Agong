import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { SYSTEM_ROLE_TO_CORE_ROLE, USER_ROLES, VALID_CORE_ROLES, isValidCoreRole } from "@/lib/validation/profiles-admin";

export async function GET() {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.ctx.supabase
    .schema("core")
    .from("profiles")
    .select("role")
    .limit(1000);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar role profile.", 500, error.message);
  }

  const existingRoles = Array.from(
    new Set(
      (data ?? [])
        .map((item) => item.role)
        .filter((role): role is (typeof VALID_CORE_ROLES)[number] =>
          typeof role === "string" && role.length > 0 && isValidCoreRole(role),
        ),
    ),
  );

  const recommendedRoles = Array.from(new Set(Object.values(SYSTEM_ROLE_TO_CORE_ROLE)));

  return ok({
    roles_in_profiles: existingRoles,
    recommended_roles: recommendedRoles,
    all_supported_roles: VALID_CORE_ROLES,
    system_role_keys: USER_ROLES,
  });
}
