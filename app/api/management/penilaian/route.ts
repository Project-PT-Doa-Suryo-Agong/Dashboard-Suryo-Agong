import { fail, ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
  let body: any;
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    try {
      body = await request.json();
    } catch {
      return fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
    }

    const {
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

    // Resolve the penilai's employee ID from hr.m_karyawan using the authenticated profile ID
    const { data: karyawanPenilai, error: penilaiErr } = await (supabaseAdmin as any)
      .schema("hr")
      .from("m_karyawan")
      .select("id")
      .eq("profile_id", auth.ctx.userId)
      .single();

    if (penilaiErr || !karyawanPenilai) {
      console.error("[PENILAIAN POST ERROR] Penilai karyawan record not found for profile_id:", auth.ctx.userId, penilaiErr);
      return fail(ErrorCode.NOT_FOUND, "Data penilai tidak ditemukan di database karyawan.", 404);
    }

    // Resolve the dinilai's employee ID from hr.m_karyawan using the sent dinilai profile ID
    const { data: karyawanDinilai, error: dinilaiErr } = await (supabaseAdmin as any)
      .schema("hr")
      .from("m_karyawan")
      .select("id")
      .eq("profile_id", dinilai)
      .single();

    if (dinilaiErr || !karyawanDinilai) {
      console.error("[PENILAIAN POST ERROR] Dinilai karyawan record not found for profile_id:", dinilai, dinilaiErr);
      return fail(ErrorCode.NOT_FOUND, "Data karyawan yang dinilai tidak ditemukan di database.", 404);
    }

    const { data, error } = await (supabaseAdmin as any)
      .schema("management")
      .from("penilaian_kerja")
      .insert({
        penilai: karyawanPenilai.id,
        dinilai: karyawanDinilai.id,
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
