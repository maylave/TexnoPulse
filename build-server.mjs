import { execSync } from "node:child_process";

const cmd = `npx caxa --input "c:/Users/Mi/главная/проекты/snapi/back" --output "C:/Users/Mi/snapi-server-test.exe" --exclude "local.db" "*.log" "dist" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/node_modules/tsx/dist/cli.mjs" "{{caxa}}/src/index.ts"`;

console.log("Running caxa build...");
execSync(cmd, { stdio: "inherit" });
console.log("Finished caxa build!");
