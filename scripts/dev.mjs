import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const serverDir = path.join(rootDir, "server");
const pluginsServerDir = path.join(rootDir, "plugins-server");

console.log("\x1b[35m%s\x1b[0m", "========================================================");
console.log("\x1b[35m%s\x1b[0m", "🚀 Запуск Snapi Ecosystem:");
console.log("\x1b[35m%s\x1b[0m", "   1. Local Chat Backend       -> http://127.0.0.1:3000");
console.log("\x1b[35m%s\x1b[0m", "   2. Standalone Plugins Server -> http://127.0.0.1:4000");
console.log("\x1b[35m%s\x1b[0m", "   3. Frontend (Vite)          -> http://localhost:1420");
console.log("\x1b[35m%s\x1b[0m", "========================================================\n");

// 1. Запуск основного локального сервера (чаты, P2P, БД)
const backend = spawn("npm run dev", {
  cwd: serverDir,
  shell: true,
  stdio: "inherit",
});

// 2. Запуск второго сервера плагинов и каталога
const pluginsServer = spawn("node --watch src/index.mjs", {
  cwd: pluginsServerDir,
  shell: true,
  stdio: "inherit",
});

// 3. Запуск Frontend (Vite)
const frontend = spawn("npm run dev:ui", {
  cwd: rootDir,
  shell: true,
  stdio: "inherit",
});

function cleanup() {
  try {
    if (process.platform === "win32") {
      if (backend.pid) spawn(`taskkill /pid ${backend.pid} /f /t`, { shell: true });
      if (pluginsServer.pid) spawn(`taskkill /pid ${pluginsServer.pid} /f /t`, { shell: true });
      if (frontend.pid) spawn(`taskkill /pid ${frontend.pid} /f /t`, { shell: true });
    } else {
      backend.kill();
      pluginsServer.kill();
      frontend.kill();
    }
  } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
