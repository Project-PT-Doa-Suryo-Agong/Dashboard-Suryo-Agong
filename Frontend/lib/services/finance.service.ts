import type { TCashflow, TPayrollHistory, TReimbursement } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("finance");

// â”€â”€â”€ t_cashflow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listCashflow(client: DbClient, page = 1, limit = 100) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_cashflow")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TCashflow[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createCashflow(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_cashflow").insert(input).select("*").single();
  return { data: data as TCashflow | null, error };
}

export async function updateCashflow(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_cashflow")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TCashflow | null, error };
}

export async function deleteCashflow(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_cashflow").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// â”€â”€â”€ t_payroll_history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listPayroll(client: DbClient, page = 1, limit = 50, employeeId?: string) {
  const from = (page - 1) * limit;
  let query = db(client)
    .from("t_payroll_history")
    .select("*", { count: "exact" })
    .order("bulan", { ascending: false })
    .range(from, from + limit - 1);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error, count } = await query;
  return { data: (data ?? []) as TPayrollHistory[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createPayroll(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_payroll_history").insert(input).select("*").single();
  return { data: data as TPayrollHistory | null, error };
}

export async function updatePayroll(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_payroll_history")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TPayrollHistory | null, error };
}

export async function deletePayroll(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_payroll_history").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// â”€â”€â”€ t_reimbursement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listReimbursement(client: DbClient, page = 1, limit = 50, employeeId?: string) {
  const from = (page - 1) * limit;
  let query = db(client)
    .from("t_reimbursement")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error, count } = await query;
  return { data: (data ?? []) as TReimbursement[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createReimbursement(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_reimbursement").insert(input).select("*").single();
  return { data: data as TReimbursement | null, error };
}

export async function updateReimbursement(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_reimbursement")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TReimbursement | null, error };
}

export async function deleteReimbursement(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_reimbursement").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

