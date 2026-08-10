import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = "branding";

export const BRANDING_ASSET_MAX_SIZE = 2 * 1024 * 1024; // 2 MB
export const BRANDING_ASSET_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
];

/**
 * Validate a branding asset (logo/favicon) file before uploading.
 */
export function validateBrandingAsset(file: File): string | null {
  if (!BRANDING_ASSET_ACCEPTED_TYPES.includes(file.type)) {
    return "Format file tidak didukung. Gunakan PNG, JPG, WEBP, SVG, atau ICO.";
  }
  if (file.size > BRANDING_ASSET_MAX_SIZE) {
    return "Ukuran file maksimal 2 MB.";
  }
  return null;
}

/**
 * Upload a branding asset (logo/favicon) to Supabase Storage and return its
 * public URL. Removes the previous asset when replacing (oldPath is the
 * storage path extracted from the previously saved public URL).
 *
 * Follows the existing public-bucket upload pattern (see upload-produk-foto.ts).
 */
export async function uploadBrandingAsset(
  file: File,
  oldPath?: string | null
): Promise<string> {
  const validationError = validateBrandingAsset(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createSupabaseBrowserClient();

  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  if (oldPath) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: false, cacheControl: "3600" });

  if (uploadError) {
    throw new Error(`Gagal upload: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Extract the storage path (filename) from a full Supabase Storage public URL
 * for the branding bucket. Returns null if the URL doesn't belong to it.
 */
export function extractBrandingStoragePath(
  publicUrl: string | null | undefined
): string | null {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    // path: /storage/v1/object/public/branding/<filename>
    const parts = url.pathname.split("/");
    const bucketIdx = parts.indexOf(BUCKET);
    if (bucketIdx === -1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}
