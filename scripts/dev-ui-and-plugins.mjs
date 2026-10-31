// scripts/dev-ui-and-plugins.mjs
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pluginsServerDir = path.join(rootDir, "plugins-server");

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(300);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function main() {
  const inUse = await isPortInUse(4000);
  let pluginsProc = null;

  if (inUse) {
    console.log("\x1b[36m%s\x1b[0m", "🔌 Plugins Server уже работает на порту 4000.");
  } else {
    console.log("\x1b[36m%s\x1b[0m", "🔌 Запуск Plugins Server (порт 4000)...");
    pluginsProc = spawn("node src/index.mjs", {
      cwd: pluginsServerDir,
      shell: true,
      stdio: "inherit"
    });
  }

  console.log("\x1b[32m%s\x1b[0m", "⚡ Запуск Vite UI (порт 1420)...");
  const viteProc = spawn("npx vite", {
    cwd: rootDir,
    shell: true,
    stdio: "inherit"
  });

  function cleanup() {
    try {
      if (process.platform === "win32") {
        if (pluginsProc && pluginsProc.pid) spawn(`taskkill /pid ${pluginsProc.pid} /f /t 2>nul`, { shell: true });
        if (viteProc && viteProc.pid) spawn(`taskkill /pid ${viteProc.pid} /f /t 2>nul`, { shell: true });
      } else {
        if (pluginsProc) pluginsProc.kill();
        viteProc.kill();
      }
    } catch {}
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}

main();
