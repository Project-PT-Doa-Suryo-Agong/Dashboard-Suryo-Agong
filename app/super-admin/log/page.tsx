"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, RefreshCw, AlertCircle, Loader2, Users } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Group = { id: string; label: string };

type ChatLog = {
  id?: string;
  group_id?: string;
  sender?: string;
  sender_name?: string;
  sender_id?: string;
  message?: string;
  message_body?: unknown;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
};

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function LogPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Ambil daftar grup dari server — GROUP_ID tidak pernah ada di client
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const res = await fetch("/api/chat-logs/groups");
        const json = (await res.json()) as { groups?: Group[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Gagal memuat daftar grup.");
        const list = json.groups ?? [];
        setGroups(list);
        if (list.length > 0) setActiveGroup(list[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setIsLoadingGroups(false);
      }
    };
    void loadGroups();
  }, []);

  // Fetch log chat melalui proxy API — URL upstream tidak terekspos ke browser
  const fetchLogs = useCallback(async (groupId: string) => {
    setIsLoadingLogs(true);
    setError(null);
    setLogs([]);
    try {
      const res = await fetch(`/api/chat-logs?group_id=${encodeURIComponent(groupId)}`);
      const json = (await res.json()) as
        | ChatLog[]
        | { data: ChatLog[] }
        | { logs: ChatLog[] }
        | { error: string };

      if (!res.ok) {
        throw new Error((json as { error: string }).error ?? `HTTP ${res.status}`);
      }

      if (Array.isArray(json)) {
        setLogs(json);
      } else if (Array.isArray((json as { data: ChatLog[] }).data)) {
        setLogs((json as { data: ChatLog[] }).data);
      } else if (Array.isArray((json as { logs: ChatLog[] }).logs)) {
        setLogs((json as { logs: ChatLog[] }).logs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeGroup) void fetchLogs(activeGroup);
  }, [activeGroup, fetchLogs]);

  // Auto-scroll ke bawah saat pesan baru masuk
  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const activeGroupLabel = groups.find((g) => g.id === activeGroup)?.label ?? activeGroup;

  return (
    // Full-height container — header page + padding sudah di-handle oleh layout
    <div className="mx-auto flex h-[calc(100vh-120px)] w-full max-w-7xl flex-col gap-4 p-4 md:p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="shrink-0 space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">Log Aktivitas</h1>
        <p className="text-sm text-slate-300">
          Monitor pesan masuk dari grup-grup WhatsApp yang terhubung ke sistem.
        </p>
      </div>

      {/* ── Layout utama (full remaining height) ── */}
      <div className="flex min-h-0 flex-1 gap-4 md:gap-6">

        {/* ── Sidebar: daftar grup (fixed, tidak ikut scroll) ── */}
        <aside className="h-full w-56 shrink-0 lg:w-64">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/10 bg-slate-800/60 p-3 shadow-sm">
            <p className="mb-2 flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-200">
              <Users className="h-3.5 w-3.5" />
              Grup WhatsApp
            </p>

            {isLoadingGroups ? (
              <div className="flex flex-1 items-center justify-center text-slate-100">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <ul className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                {groups.map((group) => (
                  <li key={group.id}>
                    <button
                      id={`group-tab-${group.label.replace(/\s+/g, "-").toLowerCase()}`}
                      onClick={() => setActiveGroup(group.id)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                        activeGroup === group.id
                          ? "bg-indigo-600 text-white shadow"
                          : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                      }`}
                    >
                      {group.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Panel kanan: header + scrollable chat ── */}
        <div className="flex h-full min-w-0 flex-1 flex-col">

          {/* Header panel — tidak ikut scroll */}
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <button
              id="btn-refresh-logs"
              onClick={() => activeGroup && void fetchLogs(activeGroup)}
              disabled={isLoadingLogs || !activeGroup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Area chat — hanya bagian ini yang scroll */}
          <div
            id="chat-container"
            ref={chatContainerRef}
            className="min-h-0 flex-1 overflow-y-auto scrollbar-hide"
          >
            {/* Loading */}
            {isLoadingLogs && (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-sm">Memuat pesan...</p>
              </div>
            )}

            {/* Error */}
            {!isLoadingLogs && error && (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-rose-500/30 bg-rose-900/20 text-center">
                <AlertCircle className="h-8 w-8 text-rose-400" />
                <div>
                  <p className="font-semibold text-rose-300">Gagal memuat data</p>
                  <p className="mt-1 text-sm text-rose-400">{error}</p>
                </div>
                <button
                  onClick={() => activeGroup && void fetchLogs(activeGroup)}
                  className="mt-2 rounded-lg bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Kosong */}
            {!isLoadingLogs && !error && logs.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/40 text-slate-400">
                <MessageSquare className="h-8 w-8 text-slate-100" />
                <p className="text-sm">Belum ada pesan di grup ini.</p>
              </div>
            )}

            {/* Daftar pesan */}
            {!isLoadingLogs && !error && logs.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/40">
                {logs.map((log, i) => {
                  const timestamp = log.timestamp ?? log.created_at;
                  const formattedTime = timestamp
                    ? new Date(timestamp).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : null;

                  const senderName =
                    (typeof log.sender_name === "string" ? log.sender_name : null) ??
                    (typeof log.sender === "string" ? log.sender : null) ??
                    (typeof log.sender_id === "string" ? log.sender_id : null) ??
                    "Unknown";

                  const message =
                    (typeof log.message === "string" && log.message ? log.message : null) ??
                    (typeof log.message_body === "string" && log.message_body
                      ? log.message_body
                      : null) ??
                    "Pesan tidak tersedia";

                  return (
                    <div
                      key={log.id ?? i}
                      className="flex flex-col gap-1.5 border-b border-slate-700/60 px-4 py-3 last:border-b-0 transition-colors hover:bg-slate-700/20"
                    >
                      {/* Sender + timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-indigo-300">
                          {senderName}
                        </span>
                        {formattedTime && (
                          <span className="shrink-0 text-[11px] text-slate-200">
                            {formattedTime}
                          </span>
                        )}
                      </div>

                      {/* Bubble pesan */}
                      <div className="rounded-lg bg-slate-700/60 px-3 py-2">
                        <p className="whitespace-pre-line break-words text-sm text-slate-100">
                          {message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
