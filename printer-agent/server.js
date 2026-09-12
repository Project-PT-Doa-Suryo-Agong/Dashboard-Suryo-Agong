import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  buildPrinter,
  getPrinterConfig,
  printReceipt,
  validatePayload,
  PrinterNotConfiguredError,
  PrinterNotConnectedError,
} from "./lib/print.js";

dotenv.config();

const PORT = Number(process.env.PRINT_AGENT_PORT || 9100);
const CORS_ORIGINS = (process.env.PRINT_AGENT_CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CORS_ORIGINS.includes("*")) {
        return callback(null, true);
      }
      if (CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} tidak diizinkan. Tambahkan ke PRINT_AGENT_CORS_ORIGINS.`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

function sendError(res, status, message, extra) {
  return res.status(status).json({ ok: false, error: message, ...(extra || {}) });
}

app.get("/status", async (_req, res) => {
  const config = getPrinterConfig();
  let connected = false;
  let error = null;

  if (config.rawInterface) {
    try {
      const printer = buildPrinter();
      connected = await printer.isPrinterConnected();
      if (!connected) {
        error = "Printer tidak terhubung (isPrinterConnected=false).";
      }
    } catch (err) {
      error = err.message || "Gagal mengecek koneksi printer.";
    }
  } else {
    error = "PRINTER_INTERFACE belum diisi. Lihat printer-agent/.env";
  }

  return res.json({
    ok: true,
    configured: Boolean(config.rawInterface),
    interface: config.rawInterface,
    connected,
    error,
    printerType: process.env.PRINTER_TYPE || "epson",
    widthMm: config.widthMm,
    widthChars: config.widthChars,
    port: PORT,
  });
});

app.get("/health", (_req, res) => {
  return res.json({ ok: true, service: "suryo-agong-printer-agent", port: PORT });
});

app.post("/print", async (req, res) => {
  try {
    const payload = validatePayload(req.body);
    await printReceipt(payload);
    return res.status(200).json({ ok: true, message: "Struk terkirim ke printer." });
  } catch (err) {
    if (err instanceof PrinterNotConfiguredError) {
      return sendError(res, 409, err.message, { code: "PRINTER_NOT_CONFIGURED" });
    }
    if (err instanceof PrinterNotConnectedError) {
      return sendError(res, 503, err.message, { code: "PRINTER_NOT_CONNECTED" });
    }
    if (err && err.message && err.message.includes("Payload")) {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, err && err.message ? err.message : "Terjadi kesalahan pada printer agent.", {
      code: "PRINTER_ERROR",
    });
  }
});

app.use((err, _req, res, _next) => {
  if (err && err.message && err.message.includes("tidak diizinkan")) {
    return sendError(res, 403, err.message, { code: "CORS_ORIGIN_DENIED" });
  }
  return sendError(res, 500, err && err.message ? err.message : "Internal server error.");
});

app.listen(PORT, () => {
  console.log(`[printer-agent] Listening on http://localhost:${PORT}`);
  console.log(`[printer-agent] CORS origins: ${CORS_ORIGINS.join(", ") || "*"}`);
  const config = getPrinterConfig();
  if (!config.rawInterface) {
    console.warn("[printer-agent] WARNING: PRINTER_INTERFACE belum diisi. Isi setelah printer tersedia (lihat README.md).");
  } else {
    console.log(`[printer-agent] Printer interface: ${config.rawInterface}`);
  }
});