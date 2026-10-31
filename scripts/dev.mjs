import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const serverDir = path.join(rootDir, "server");

console.log("\x1b[33m%s\x1b[0m", "========================================");
console.log("\x1b[33m%s\x1b[0m", "🚀 Запуск Backend (tsx) + Frontend (Vite)...");
console.log("\x1b[33m%s\x1b[0m", "========================================\n");

// 1. Запуск Backend (tsx watch src/index.ts)
const backend = spawn("npm run dev", {
  cwd: serverDir,
  shell: true,
  stdio: "inherit",
});

// 2. Запуск Frontend (Vite на http://localhost:1420)
const frontend = spawn("npm run dev:ui", {
  cwd: rootDir,
  shell: true,
  stdio: "inherit",
});

function cleanup() {
  try {
    if (process.platform === "win32") {
      if (backend.pid) spawn(`taskkill /pid ${backend.pid} /f /t`, { shell: true });
      if (frontend.pid) spawn(`taskkill /pid ${frontend.pid} /f /t`, { shell: true });
    } else {
      backend.kill();
      frontend.kill();
    }
  } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
