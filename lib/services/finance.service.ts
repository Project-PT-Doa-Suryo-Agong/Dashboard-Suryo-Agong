/**
 * @deprecated — FASE 2 MIGRASI HYBRID BACKEND
 *
 * File ini sudah di-deprecated per April 2026.
 * Segera migrasikan endpoint yang menggunakan service ini menuju direct Supabase hooks.
 * 
 * @see lib/supabase/hooks/use-finance.ts
 */
import type { TCashflow, TPayrollHistory, TReimbursement, MCoa, MCoaInsert, TJournal, TJournalItem } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("finance");

//  t_cashflow 

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

//  t_payroll_history 

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

//  t_reimbursement 

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

// m_coa

export async function listCoa(client: DbClient, page = 1, limit = 100) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_coa")
    .select("*", { count: "exact" })
    .order("kode_akun", { ascending: true })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as MCoa[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createCoa(client: DbClient, input: MCoaInsert) {
  const { data, error } = await db(client).from("m_coa").insert(input).select("*").single();
  return { data: data as MCoa | null, error };
}

export async function updateCoa(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("m_coa").update(input).eq("id", id).select("*").maybeSingle();
  return { data: data as MCoa | null, error };
}

export async function deleteCoa(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_coa").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// t_journal

export async function listJurnal(client: DbClient, page = 1, limit = 100) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_journal")
    .select("*", { count: "exact" })
    .order("tanggal", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TJournal[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createJurnal(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_journal").insert(input as any).select("*").single();
  return { data: data as TJournal | null, error };
}

export async function updateJurnal(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_journal").update(input).eq("id", id).select("*").maybeSingle();
  return { data: data as TJournal | null, error };
}

export async function deleteJurnal(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_journal").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// t_journal_item

export async function listJurnalItem(client: DbClient, journalId: string) {
  const { data, error } = await db(client)
    .from("t_journal_item")
    .select("*")
    .eq("journal_id", journalId)
    .order("created_at", { ascending: true });
  return { data: (data ?? []) as TJournalItem[], error };
}

export async function createJurnalItem(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_journal_item").insert(input as any).select("*").single();
  return { data: data as TJournalItem | null, error };
}

export async function updateJurnalItem(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_journal_item").update(input).eq("id", id).select("*").maybeSingle();
  return { data: data as TJournalItem | null, error };
}

export async function deleteJurnalItem(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_journal_item").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

