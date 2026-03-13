import type { Profile } from "@/types/supabase";
import type {
  CreateProfileInput,
  UpdateOwnProfileInput,
  UpdateProfileByIdInput,
} from "@/types/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DbClient = ReturnType<typeof createSupabaseServerClient>;

export async function getProfileById(client: DbClient, userId: string) {
  const { data, error } = await (client as any)
    .schema("core")
    .from("profiles")
    .select("id, nama, role, phone, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  return { data: data as Profile | null, error };
}

export async function updateOwnProfile(
  client: DbClient,
  userId: string,
  input: UpdateOwnProfileInput
) {
  const payload = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (client as any)
    .schema("core")
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("id, nama, role, phone, created_at, updated_at")
    .single();

  return { data: data as Profile | null, error };
}

export async function listProfiles(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await (client as any)
    .schema("core")
    .from("profiles")
    .select("id, nama, role, phone, created_at, updated_at", {
      count: "exact",
    })
    .order("updated_at", { ascending: false })
    .range(from, to);

  return {
    data: (data ?? []) as Profile[],
    error,
    meta: {
      page,
      limit,
      total: count ?? 0,
    },
  };
}

export async function createProfile(client: DbClient, input: CreateProfileInput) {
  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    })

  if (authError || !authUser.user) {
    return { data: null, error: authError }
  }

  const payload = {
    id: authUser.user.id,
    nama: input.nama,
    role: input.role,
    phone: input.phone,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await (client as any)
    .schema("core")
    .from("profiles")
    .insert(payload)
    .select("id, nama, role, phone, created_at, updated_at")
    .single()

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    return { data: null, error }
  }

  return { data: data as Profile | null, error: null }
}

export async function updateProfileById(
  client: DbClient,
  id: string,
  input: UpdateProfileByIdInput
) {
  const payload = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (client as any)
    .schema("core")
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select("id, nama, role, phone, created_at, updated_at")
    .maybeSingle();

  return { data: data as Profile | null, error };
}

export async function deleteProfileById(client: DbClient, id: string) {
  const { error, count } = await (client as any)
    .schema("core")
    .from("profiles")
    .delete({ count: "exact" })
    .eq("id", id);

  return {
    error,
    deleted: (count ?? 0) > 0,
  };
}
