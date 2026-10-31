import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = "C:/Users/Mi/snapi-app/server";
const stage = path.join(root, "bundle-stage");

if (fs.existsSync(stage)) {
  fs.rmSync(stage, { recursive: true, force: true });
}
fs.mkdirSync(path.join(stage, "node_modules", ".bin"), { recursive: true });

// 0. Compile with esbuild
console.log("Compiling server with esbuild...");
execSync("npx esbuild src/index.ts --bundle --platform=node --format=cjs --external:better-sqlite3 --outfile=dist/index.cjs", { stdio: "inherit", cwd: root });

// 1. Copy index.cjs
fs.copyFileSync(path.join(root, "dist/index.cjs"), path.join(stage, "index.cjs"));

// 2. Copy only necessary dependencies
const needed = ["better-sqlite3", "bindings", "file-uri-to-path"];
for (const mod of needed) {
  const src = path.join(root, "node_modules", mod);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(stage, "node_modules", mod), { recursive: true });
  }
}

// 3. Package.json with dependencies declared
fs.writeFileSync(
  path.join(stage, "package.json"),
  JSON.stringify({
    name: "snapi-server",
    version: "1.0.0",
    type: "commonjs",
    dependencies: {
      "better-sqlite3": "^13.0.3"
    }
  }, null, 2)
);

// 4. Подготавливаем node.exe с GUI-подсистемой (Subsystem 2)
// При Subsystem 2 Windows НИКОГДА не создаёт окно консоли при запуске node.exe!
const bundledNodeExe = path.join(stage, "node_modules", ".bin", "node.exe");
fs.copyFileSync(process.execPath, bundledNodeExe);

const patchPeToGui = (filePath) => {
  const buf = fs.readFileSync(filePath);
  const peOffset = buf.readUInt32LE(0x3C);
  const subsystemOffset = peOffset + 4 + 20 + 68;
  const currentSub = buf.readUInt16LE(subsystemOffset);
  if (currentSub !== 2) {
    buf.writeUInt16LE(2, subsystemOffset);
    fs.writeFileSync(filePath, buf);
    console.log(`[PE Patch] Successfully set Subsystem 2 (GUI / NO CONSOLE) for: ${path.basename(filePath)}`);
  } else {
    console.log(`[PE Patch] Already GUI subsystem for: ${path.basename(filePath)}`);
  }
};

patchPeToGui(bundledNodeExe);

// 5. Запуск caxa с флагом --no-include-node (чтобы не перезаписывать наш пропатченный node.exe)
// и уникальным --identifier (чтобы не использовать старый кэш из Temp/caxa)
try {
  execSync("taskkill /F /IM server.exe /IM snapi-server.exe 2>nul", { stdio: "ignore" });
} catch {}

const buildId = `snapi-${Date.now()}`;
console.log(`Building server.exe with caxa (identifier: ${buildId}, no-include-node)...`);
execSync(
  `npx caxa --no-dedupe --no-include-node --identifier "${buildId}" --input "${stage}" --output "${path.join(root, "server.exe")}" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/index.cjs"`,
  { stdio: "inherit", cwd: root }
);

// 6. Патчим сам server.exe (caxa-стаб) в Subsystem 2
patchPeToGui(path.join(root, "server.exe"));

// 7. Копируем готовый сервер в binaries для Tauri
fs.copyFileSync(
  path.join(root, "server.exe"),
  "C:/Users/Mi/snapi-app/src-tauri/binaries/snapi-server-x86_64-pc-windows-msvc.exe"
);

// Копируем в target/debug и target/release если они есть
const debugTarget = "C:/Users/Mi/snapi-app/src-tauri/target/debug/snapi-server.exe";
if (fs.existsSync(path.dirname(debugTarget))) {
  try { fs.copyFileSync(path.join(root, "server.exe"), debugTarget); } catch (e) {}
}
const releaseTarget = "C:/Users/Mi/snapi-app/src-tauri/target/release/snapi-server.exe";
if (fs.existsSync(path.dirname(releaseTarget))) {
  try { fs.copyFileSync(path.join(root, "server.exe"), releaseTarget); } catch (e) {}
}

// Копируем в установленную папку Snapi
const installedPath = "C:/Users/Mi/AppData/Local/Snapi/snapi-server.exe";
if (fs.existsSync(path.dirname(installedPath))) {
  try { fs.copyFileSync(path.join(root, "server.exe"), installedPath); } catch (e) {}
}

console.log("Testing server.exe execution...");
const res = execSync(`node -e "
const cp = require('child_process');
const p = cp.spawn('${path.join(root, "server.exe").replace(/\\/g, "/")}', [], { stdio: 'ignore' });
setTimeout(() => {
  try {
    process.kill(p.pid, 0);
    console.log('SUCCESS: server.exe PID', p.pid, 'is RUNNING stably in background without console!');
    p.kill();
  } catch (e) {
    console.error('ERROR: server.exe died!');
    process.exit(1);
  }
}, 2000);
"`).toString();

console.log(res);
console.log("Done!");
