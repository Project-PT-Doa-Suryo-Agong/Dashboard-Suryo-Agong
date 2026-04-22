import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

const EMPLOYEE_PHOTO_BUCKET = "employee_documents";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type PhotoField = "foto_perorangan" | "foto_ktp" | "foto_kk";
type EmployeePhotoColumn = "foto_perorangan_url" | "foto_ktp_url" | "foto_kk_url";

const PHOTO_FIELD_TO_COLUMN: Record<PhotoField, EmployeePhotoColumn> = {
  foto_perorangan: "foto_perorangan_url",
  foto_ktp: "foto_ktp_url",
  foto_kk: "foto_kk_url",
};

function sanitizeExt(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fromMime = file.type.split("/").pop()?.toLowerCase() ?? "";
  const candidate = fromName || fromMime || "jpg";
  return candidate.replace(/[^a-z0-9]/g, "") || "jpg";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function extractStoragePathFromPublicUrl(urlValue: string | null | undefined): string | null {
  if (!urlValue) return null;

  try {
    const parsed = new URL(urlValue);
    const marker = `/storage/v1/object/public/${EMPLOYEE_PHOTO_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return parsed.pathname.slice(index + marker.length);
  } catch {
    return null;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID karyawan wajib diisi.", 400);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus multipart/form-data valid.", 400);
  }

  for (const field of Object.keys(PHOTO_FIELD_TO_COLUMN) as PhotoField[]) {
    const entries = formData.getAll(field);
    if (entries.length > 1) {
      return fail(ErrorCode.VALIDATION_ERROR, `${field} maksimal 1 file.`, 400);
    }
  }

  const selectedFiles = (Object.keys(PHOTO_FIELD_TO_COLUMN) as PhotoField[])
    .map((field) => ({ field, value: formData.get(field) }))
    .filter((item): item is { field: PhotoField; value: File } => item.value instanceof File && item.value.size > 0);

  if (selectedFiles.length === 0) {
    return fail(
      ErrorCode.VALIDATION_ERROR,
      "Minimal satu file wajib diupload: foto_perorangan, foto_ktp, atau foto_kk.",
      400,
    );
  }

  for (const item of selectedFiles) {
    if (!item.value.type.startsWith("image/")) {
      return fail(ErrorCode.VALIDATION_ERROR, `${item.field} harus berupa file gambar.`, 400);
    }
    if (item.value.size > MAX_FILE_SIZE_BYTES) {
      return fail(ErrorCode.VALIDATION_ERROR, `${item.field} maksimal 5MB.`, 400);
    }
  }

  const { data: existingEmployee, error: fetchError } = await auth.ctx.supabase
    .schema("hr")
    .from("m_karyawan")
    .select("id, foto_perorangan_url, foto_ktp_url, foto_kk_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data karyawan sebelum upload foto.", 500, fetchError.message);
  }
  if (!existingEmployee) {
    return fail(ErrorCode.NOT_FOUND, "Data karyawan tidak ditemukan.", 404);
  }

  const updatePayload: Partial<Record<EmployeePhotoColumn, string>> = {};
  const oldPathsToDelete: string[] = [];
  const uploadedByField: Partial<Record<PhotoField, string>> = {};

  for (const item of selectedFiles) {
    const column = PHOTO_FIELD_TO_COLUMN[item.field];
    const ext = sanitizeExt(item.value);
    const filePath = `karyawan/${id}/${item.field}-${Date.now()}-${randomSuffix()}.${ext}`;
    const fileBuffer = Buffer.from(await item.value.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(EMPLOYEE_PHOTO_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: item.value.type,
        upsert: true,
      });

    if (uploadError) {
      return fail(ErrorCode.DB_ERROR, `Gagal upload ${item.field} ke storage.`, 500, uploadError.message);
    }

    const publicUrl = supabaseAdmin.storage.from(EMPLOYEE_PHOTO_BUCKET).getPublicUrl(filePath).data.publicUrl;
    updatePayload[column] = publicUrl;
    uploadedByField[item.field] = publicUrl;

    const oldPath = extractStoragePathFromPublicUrl(existingEmployee[column]);
    if (oldPath && oldPath !== filePath) {
      oldPathsToDelete.push(oldPath);
    }
  }

  const { data: updatedEmployee, error: updateError } = await auth.ctx.supabase
    .schema("hr")
    .from("m_karyawan")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return fail(ErrorCode.DB_ERROR, "Gagal menyimpan URL foto ke data karyawan.", 500, updateError.message);
  }
  if (!updatedEmployee) {
    return fail(ErrorCode.NOT_FOUND, "Data karyawan tidak ditemukan saat update foto.", 404);
  }

  if (oldPathsToDelete.length > 0) {
    await supabaseAdmin.storage.from(EMPLOYEE_PHOTO_BUCKET).remove(oldPathsToDelete);
  }

  return ok(
    {
      karyawan: updatedEmployee,
      uploaded: uploadedByField,
    },
    "Foto karyawan berhasil diupload.",
  );
}