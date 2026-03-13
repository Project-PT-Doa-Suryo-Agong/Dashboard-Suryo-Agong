import { fail, ok } from "@/lib/http/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body request harus JSON valid.", 400);
  }

  if (!body || typeof body !== "object") {
    return fail("BAD_REQUEST", "Body harus berupa object JSON.", 400);
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || email.trim() === "") {
    return fail("VALIDATION_ERROR", "Email wajib diisi.", 400);
  }

  if (typeof password !== "string" || password === "") {
    return fail("VALIDATION_ERROR", "Password wajib diisi.", 400);
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return fail("AUTH_ERROR", "Email atau password salah.", 401, error.message);
  }

  return ok(
    {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    },
    "Login berhasil."
  );
}
