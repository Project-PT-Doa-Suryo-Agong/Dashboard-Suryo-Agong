import { ok } from "@/lib/http/response";

export async function POST() {
  const response = ok(null, "Logout berhasil.");

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  const authCookieName = projectRef
    ? `sb-${projectRef}-auth-token`
    : "sb-mhfdzprxauqfczmtyizg-auth-token";

  response.cookies.set(authCookieName, "", {
    expires: new Date(0),
    path: "/",
    domain: ".lvh.me",
  });
  response.cookies.set(authCookieName, "", {
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set("role", "", {
    expires: new Date(0),
    path: "/",
    domain: ".lvh.me",
  });
  response.cookies.set("role", "", {
    expires: new Date(0),
    path: "/",
  });

  return response;
}
