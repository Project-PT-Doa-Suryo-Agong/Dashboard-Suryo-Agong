import type { CoreUserRole } from "@/types/supabase";

export type UpdateOwnProfileInput = {
  nama?: string | null;
  phone?: string | null;
};

export type CreateProfileInput = {
  email: string;
  password: string;
  nama: string;
  role: CoreUserRole;
  phone?: string | null;
};

export type UpdateProfileByIdInput = {
  nama?: string;
  role?: CoreUserRole;
  phone?: string | null;
};
