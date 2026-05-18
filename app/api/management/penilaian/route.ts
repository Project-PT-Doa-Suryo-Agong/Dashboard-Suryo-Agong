import { fail, ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const role = (auth.ctx.role || "").toLowerCase();
    const canView = ["super admin", "admin", "management", "hr", "human resources"].some(r => role.includes(r));
    if (!canView) {
      return fail(ErrorCode.FORBIDDEN, "Akses ditolak. Anda tidak memiliki izin untuk melihat rekap penilaian.", 403);
    }

    const { data, error } = await (auth.ctx.supabase as any)
      .schema("management")
      .from("view_rekap_penilaian")
      .select("*")
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false });

    if (error) {
      console.error("[PENILAIAN GET ERROR]", error);
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data rekap penilaian.", 500, error.message);
    }

    const items = data ?? [];

    // Enrich with attendance data per karyawan per bulan
    // 1. Get all unique employee names
    const uniqueNames = [...new Set(items.map((i: any) => i.nama_karyawan as string))];

    // 2. Lookup employee IDs from hr.m_karyawan
    let employeeMap: Record<string, string> = {}; // nama -> id
    if (uniqueNames.length > 0) {
      const { data: karyawanData } = await (auth.ctx.supabase as any)
        .schema("hr")
        .from("m_karyawan")
        .select("id, nama")
        .in("nama", uniqueNames);
      for (const k of karyawanData ?? []) {
        employeeMap[k.nama] = k.id;
      }
    }

    // 3. Batch-fetch all attendance records for these employees
    const employeeIds = Object.values(employeeMap).filter(Boolean);
    let allAttendance: any[] = [];
    if (employeeIds.length > 0) {
      const { data: attData } = await (auth.ctx.supabase as any)
        .schema("hr")
        .from("t_attendance")
        .select("employee_id, tanggal, status")
        .in("employee_id", employeeIds);
      allAttendance = attData ?? [];
    }

    // 4. Build attendance summary per (employee_id, bulan, tahun)
    const enrichedItems = items.map((item: any) => {
      const empId = employeeMap[item.nama_karyawan];
      if (!empId) {
        return { ...item, presensi: null };
      }

      // Filter attendance for this employee & month
      const records = allAttendance.filter((a: any) => {
        if (a.employee_id !== empId) return false;
        const d = new Date(a.tanggal);
        return d.getMonth() + 1 === item.bulan && d.getFullYear() === item.tahun;
      });

      const hadir = records.filter((r: any) => r.status === "hadir").length;
      const sakit = records.filter((r: any) => r.status === "sakit").length;
      const izin = records.filter((r: any) => r.status === "izin").length;
      const alpha = records.filter((r: any) => r.status === "alpha").length;
      const total = records.length;

      // Calculate working days for the month
      const daysInMonth = new Date(item.tahun, item.bulan, 0).getDate();
      let workingDays = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(item.tahun, item.bulan - 1, d).getDay();
        if (day !== 0 && day !== 6) workingDays++;
      }

      const persentase = workingDays > 0 ? Math.round((hadir / workingDays) * 10000) / 100 : 0;

      return {
        ...item,
        presensi: { hadir, sakit, izin, alpha, total, workingDays, persentase },
      };
    });

    return ok({ items: enrichedItems });
  } catch (err: any) {
    console.error("[PENILAIAN GET FATAL ERROR]", err);
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan sistem internal.", 500, err?.message);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
    }

    const {
      penilai,
      dinilai,
      kepribadian_sikap,
      teamwork,
      pengetahuan_wawasan,
      komunikasi_pemasaran,
      networking_data,
      produktivitas,
      problem_solving,
      leadership,
      tanggal_penilaian,
    } = body;

    const { data, error } = await (auth.ctx.supabase as any)
      .schema("management")
      .from("penilaian_kerja")
      .insert({
        penilai,
        dinilai,
        kepribadian_sikap,
        teamwork,
        pengetahuan_wawasan,
        komunikasi_pemasaran,
        networking_data,
        produktivitas,
        problem_solving,
        leadership,
        tanggal_penilaian,
      })
      .select()
      .single();

    if (error) {
      console.error("[PENILAIAN POST ERROR]", error);
      return fail(ErrorCode.DB_ERROR, "Gagal menyimpan penilaian.", 500, error.message);
    }

    return ok({ item: data }, "Penilaian berhasil disimpan.", 201);
  } catch (err: any) {
    console.error("[PENILAIAN POST FATAL ERROR]", err);
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan sistem internal.", 500, err?.message);
  }
}
