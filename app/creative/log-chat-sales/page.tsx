"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ChatLog = {
  id?: string;
  group_id?: string;
  sender?: string;
  sender_name?: string;
  sender_id?: string;
  message?: string;
  message_body?: unknown;
  message_answer?: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
};

// Sales Agent group ID — sesuai mapping di api/chat-logs/groups/route.ts
const SALES_AGENT_GROUP_ID = "120363425433038810@g.us";

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function LogChatSalesPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);

  // Fetch log chat Sales Agent melalui proxy API
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLogs([]);
    try {
      const res = await fetch(
        `/api/chat-logs?group_id=${encodeURIComponent(SALES_AGENT_GROUP_ID)}`
      );
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // Auto-scroll ke bawah saat pesan baru masuk
  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const openAnswerModal = (answer: string) => {
    setActiveAnswer(answer);
    setIsAnswerModalOpen(true);
  };

  const closeAnswerModal = () => {
    setActiveAnswer(null);
    setIsAnswerModalOpen(false);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-120px)] w-full max-w-6xl flex-col gap-4 p-4 md:p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="shrink-0 space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">Log Chat Sales</h1>
        <p className="text-sm text-slate-300">
          Monitor pesan masuk dari grup WhatsApp Sales Agent.
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          id="btn-refresh-sales-logs"
          onClick={() => void fetchLogs()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Sales Agent
        </span>
      </div>

      {/* ── Chat area ── */}
      <div
        id="sales-chat-container"
        ref={chatContainerRef}
        className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm scrollbar-hide"
      >
        {/* Loading */}
        {isLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm">Memuat pesan...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-600">Gagal memuat data</p>
              <p className="mt-1 text-sm text-rose-500">{error}</p>
            </div>
            <button
              onClick={() => void fetchLogs()}
              className="mt-2 rounded-lg bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-500"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Kosong */}
        {!isLoading && !error && logs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <MessageSquare className="h-8 w-8 text-slate-300" />
            <p className="text-sm">Belum ada pesan di grup Sales Agent.</p>
          </div>
        )}

        {/* Daftar pesan */}
        {!isLoading && !error && logs.length > 0 && (
          <div className="flex flex-col gap-2 p-4">
            {[...logs]
              .sort((a, b) => {
                const tA = new Date(a.timestamp ?? a.created_at ?? 0).getTime();
                const tB = new Date(b.timestamp ?? b.created_at ?? 0).getTime();
                return tA - tB;
              })
              .map((log, i) => {
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

                const fullAnswer =
                  typeof log.message_answer === "string" ? log.message_answer : "";
                const hasAnswer = fullAnswer.trim().length > 0;
                const truncatedAnswer = hasAnswer
                  ? fullAnswer.length > 150
                    ? `${fullAnswer.slice(0, 150)}...`
                    : fullAnswer
                  : "";

                return (
                  <div
                    key={log.id ?? i}
                    className="flex flex-col gap-1.5 rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                  >
                    {/* Sender + timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-blue-700">
                        {senderName}
                      </span>
                      {formattedTime && (
                        <span className="shrink-0 text-xs text-slate-500">
                          {formattedTime}
                        </span>
                      )}
                    </div>

                    {/* Bubble pesan */}
                    <div className="rounded-lg bg-slate-200 px-3 py-2">
                      <p className="whitespace-pre-line break-words text-sm text-slate-800">
                        {message}
                      </p>
                    </div>

                    {hasAnswer && (
                      <div className="rounded-lg bg-blue-50 px-3 py-2">
                        <p className="whitespace-pre-line break-words text-sm text-slate-700">
                          {truncatedAnswer}
                        </p>
                        <button
                          type="button"
                          onClick={() => openAnswerModal(fullAnswer)}
                          className="mt-2 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          Detail
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Answer Detail Modal */}
      {isAnswerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeAnswerModal}
          />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-900">Detail Jawaban AI</h2>
              <button
                type="button"
                onClick={closeAnswerModal}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 scrollbar-hide">
              {activeAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
