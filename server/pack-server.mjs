import { execSync } from "node:child_process";
import fs from "node:fs";

console.log("Step 1: Bundling server with esbuild...");
execSync(
  "npx esbuild src/index.ts --bundle --platform=node --format=cjs --external:better-sqlite3 --outfile=dist/index.cjs",
  { stdio: "inherit", cwd: "C:/Users/Mi/snapi-app/server" }
);

console.log("Step 2: Packaging server into server.exe with caxa...");
execSync(
  'npx caxa --input "C:/Users/Mi/snapi-app/server" --output "C:/Users/Mi/snapi-app/server/server.exe" --exclude "local.db" "*.log" "src" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/dist/index.cjs"',
  { stdio: "inherit", cwd: "C:/Users/Mi/snapi-app/server" }
);

console.log("Step 3: Copying server.exe to src-tauri/binaries/snapi-server-x86_64-pc-windows-msvc.exe...");
fs.copyFileSync(
  "C:/Users/Mi/snapi-app/server/server.exe",
  "C:/Users/Mi/snapi-app/src-tauri/binaries/snapi-server-x86_64-pc-windows-msvc.exe"
);

console.log("ALL DONE SUCCESSFULLY!");
