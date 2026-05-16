import { fail, ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";

/**
 * GET /api/management/penilaian/attendance?nama=...&bulan=...&tahun=...
 * Returns attendance summary (hadir, sakit, izin, alpha, total, percentage) for a given employee in a specific month.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const role = (auth.ctx.role || "").toLowerCase();
    const canView = ["super admin", "admin", "management", "hr", "human resources"].some(r => role.includes(r));
    if (!canView) {
      return fail(ErrorCode.FORBIDDEN, "Akses ditolak.", 403);
    }

    const { searchParams } = new URL(request.url);
    const nama = searchParams.get("nama");
    const bulan = searchParams.get("bulan");
    const tahun = searchParams.get("tahun");

    if (!nama || !bulan || !tahun) {
      return fail(ErrorCode.VALIDATION_ERROR, "Parameter nama, bulan, dan tahun wajib diisi.", 400);
    }

    const bulanNum = parseInt(bulan, 10);
    const tahunNum = parseInt(tahun, 10);

    // Build date range for the month
    const startDate = `${tahunNum}-${String(bulanNum).padStart(2, "0")}-01`;
    const endMonth = bulanNum === 12 ? 1 : bulanNum + 1;
    const endYear = bulanNum === 12 ? tahunNum + 1 : tahunNum;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    // First, find the employee_id by name from hr.m_karyawan
    const { data: karyawanData, error: karyawanError } = await (auth.ctx.supabase as any)
      .schema("hr")
      .from("m_karyawan")
      .select("id")
      .ilike("nama", nama)
      .limit(1)
      .maybeSingle();

    if (karyawanError) {
      console.error("[ATTENDANCE SUMMARY] karyawan lookup error:", karyawanError);
      return fail(ErrorCode.DB_ERROR, "Gagal mencari data karyawan.", 500, karyawanError.message);
    }

    if (!karyawanData) {
      // Return empty summary if employee not found in hr table
      return ok({
        summary: { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0, persentase: 0 },
      });
    }

    // Query attendance for this employee in the given month
    const { data: attendanceData, error: attendanceError } = await (auth.ctx.supabase as any)
      .schema("hr")
      .from("t_attendance")
      .select("status")
      .eq("employee_id", karyawanData.id)
      .gte("tanggal", startDate)
      .lt("tanggal", endDate);

    if (attendanceError) {
      console.error("[ATTENDANCE SUMMARY] attendance query error:", attendanceError);
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data presensi.", 500, attendanceError.message);
    }

    const records = attendanceData ?? [];
    const total = records.length;
    const hadir = records.filter((r: any) => r.status === "hadir").length;
    const sakit = records.filter((r: any) => r.status === "sakit").length;
    const izin = records.filter((r: any) => r.status === "izin").length;
    const alpha = records.filter((r: any) => r.status === "alpha").length;

    // Calculate working days in the month (approx: exclude weekends)
    const daysInMonth = new Date(tahunNum, bulanNum, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(tahunNum, bulanNum - 1, d).getDay();
      if (day !== 0 && day !== 6) workingDays++; // exclude Sunday(0) and Saturday(6)
    }

    const persentase = workingDays > 0 ? Math.round((hadir / workingDays) * 10000) / 100 : 0;

    return ok({
      summary: { hadir, sakit, izin, alpha, total, workingDays, persentase },
    });
  } catch (err: any) {
    console.error("[ATTENDANCE SUMMARY FATAL]", err);
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan sistem.", 500, err?.message);
  }
}
