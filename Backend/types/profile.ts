export type UpdateOwnProfileInput = {
  nama?: string | null;
  phone?: string | null;
};

export type CreateProfileInput = {
  email: string;
  password: string;
  nama: string;
  role: string;
  phone?: string | null;
};

export type UpdateProfileByIdInput = {
  nama?: string;
  role?: string;
  phone?: string | null;
};
