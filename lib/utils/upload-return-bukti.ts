import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const BUCKET = "returns";

function buildUploadPath(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}.${ext}`;
}

export async function uploadReturnBukti(file: File, oldPath?: string | null): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const uploadPath = buildUploadPath(file);

  if (oldPath) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(uploadPath, file, { upsert: false, cacheControl: "3600" });

  if (error) {
    throw new Error(`Gagal upload bukti retur: ${error.message}`);
  }

  return uploadPath;
}

export function getStorageFileName(path: string | null | undefined): string {
  if (!path) return "-";
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}
