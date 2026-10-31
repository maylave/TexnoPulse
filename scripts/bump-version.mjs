import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const pkgPath = path.join(rootDir, "package.json");
const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const cargoTomlPath = path.join(rootDir, "src-tauri", "Cargo.toml");
const serverPkgPath = path.join(rootDir, "server", "package.json");
const versionTsPath = path.join(rootDir, "src", "version.ts");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const currentVersion = pkg.version || "0.0.4";

let newVersion = "0.0.5";

const args = process.argv.slice(2);
const setArg = args.find((a) => a.startsWith("--set"));

if (setArg) {
  if (setArg.includes("=")) {
    newVersion = setArg.split("=")[1].trim();
  } else {
    const idx = args.indexOf(setArg);
    if (args[idx + 1]) newVersion = args[idx + 1].trim();
  }
} else if (currentVersion.startsWith("0.0.")) {
  const parts = currentVersion.split(".").map(Number);
  const patch = (isNaN(parts[2]) ? 4 : parts[2]) + 1;
  newVersion = `0.0.${patch}`;
} else {
  // Начинаем с 0.0.5, как указано в запросе
  newVersion = "0.0.5";
}

// 1. Обновляем package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// 2. Обновляем tauri.conf.json
if (fs.existsSync(tauriConfPath)) {
  const conf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));
  conf.version = newVersion;
  fs.writeFileSync(tauriConfPath, JSON.stringify(conf, null, "\t") + "\n");
}

// 3. Обновляем Cargo.toml
if (fs.existsSync(cargoTomlPath)) {
  let cargo = fs.readFileSync(cargoTomlPath, "utf8");
  cargo = cargo.replace(
    /(\[package\][\s\S]*?version\s*=\s*)"[^"]+"/,
    `$1"${newVersion}"`
  );
  fs.writeFileSync(cargoTomlPath, cargo);
}

// 4. Обновляем server/package.json
if (fs.existsSync(serverPkgPath)) {
  const sPkg = JSON.parse(fs.readFileSync(serverPkgPath, "utf8"));
  sPkg.version = newVersion;
  fs.writeFileSync(serverPkgPath, JSON.stringify(sPkg, null, "\t") + "\n");
}

// 5. Создаем/обновляем src/version.ts для фронтенда
fs.writeFileSync(
  versionTsPath,
  `// Автоматически сгенерировано scripts/bump-version.mjs\nexport const APP_VERSION = '${newVersion}';\n`
);

console.log(`\x1b[32m%s\x1b[0m`, `>>> [Version Bump] Версия успешно обновлена до: ${newVersion}`);
