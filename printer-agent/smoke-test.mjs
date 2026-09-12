import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PORT = 9101;
const agentDir = fileURLToPath(new URL(".", import.meta.url));
const child = spawn(process.execPath, ["server.js"], {
  cwd: agentDir,
  env: { ...process.env, PRINT_AGENT_PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let out = "";
child.stdout.on("data", (d) => (out += d.toString()));
child.stderr.on("data", (d) => (out += d.toString()));

const base = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(path, opts) {
  const res = await fetch(base + path, opts);
  let body = null;
  try { body = await res.json(); } catch { body = await res.text(); }
  return { status: res.status, body };
}

try {
  await sleep(1200);
  const status = await req("/status");
  console.log("GET /status ->", status.status, JSON.stringify(status.body));
  const health = await req("/health");
  console.log("GET /health ->", health.status, JSON.stringify(health.body));
  const print = await req("/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ widthMm: 48, items: [] }),
  });
  console.log("POST /print (belum dikonfigurasi) ->", print.status, JSON.stringify(print.body));
  const bad = await req("/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nope: true }),
  });
  console.log("POST /print (payload invalid) ->", bad.status, JSON.stringify(bad.body));
  const cors = await fetch(base + "/status", { headers: { Origin: "http://evil.example.com" } });
  console.log("CORS evil origin ->", cors.status);
} catch (err) {
  console.error("TEST FAILED:", err.message);
} finally {
  child.kill();
  await sleep(300);
  console.log("--- server stdout/stderr ---");
  console.log(out.slice(0, 2000));
  process.exit(0);
}