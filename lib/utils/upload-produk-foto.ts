import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = "products";

/**
 * Upload a product photo to Supabase Storage and return its public URL.
 *
 * @param file  - The File object selected by the user.
 * @param oldPath - Optional existing storage path to delete before uploading.
 * @returns The public URL of the uploaded image.
 */
export async function uploadProdukFoto(
  file: File,
  oldPath?: string | null,
): Promise<string> {
  const supabase = createSupabaseBrowserClient();

  // Build a unique path: produk-foto/<timestamp>-<random>.<ext>
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Remove old file if replacing
  if (oldPath) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: false, cacheControl: "3600" });

  if (uploadError) {
    throw new Error(`Gagal upload foto: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Extract the storage path (filename) from a full Supabase Storage public URL.
 * Returns null if the URL doesn't belong to this bucket.
 */
export function extractStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    // path: /storage/v1/object/public/products/<filename>
    const parts = url.pathname.split("/");
    const bucketIdx = parts.indexOf(BUCKET);
    if (bucketIdx === -1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}
