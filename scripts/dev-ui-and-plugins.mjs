// scripts/dev-ui-and-plugins.mjs
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pluginsServerDir = path.join(rootDir, "plugins-server");

console.log("\x1b[36m%s\x1b[0m", "🔌 Запуск Plugins Server (порт 4000)...");
const pluginsProc = spawn("node src/index.mjs", {
  cwd: pluginsServerDir,
  shell: true,
  stdio: "inherit"
});

console.log("\x1b[32m%s\x1b[0m", "⚡ Запуск Vite UI (порт 1420)...");
const viteProc = spawn("npx vite", {
  cwd: rootDir,
  shell: true,
  stdio: "inherit"
});

function cleanup() {
  try {
    if (process.platform === "win32") {
      if (pluginsProc.pid) spawn(`taskkill /pid ${pluginsProc.pid} /f /t 2>nul`, { shell: true });
      if (viteProc.pid) spawn(`taskkill /pid ${viteProc.pid} /f /t 2>nul`, { shell: true });
    } else {
      pluginsProc.kill();
      viteProc.kill();
    }
  } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
