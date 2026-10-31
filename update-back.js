const fs = require('fs');
const filePath = 'c:/Users/Mi/главная/проекты/snapi/back/src/app.ts';
let content = fs.readFileSync(filePath, 'utf8');
const target = 'allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"]';
const replacement = 'allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:1420", "http://127.0.0.1:1420", "tauri://localhost", "http://tauri.localhost", "https://tauri.localhost"]';
if (!content.includes(target)) {
  console.error('Target not found!');
  process.exit(1);
}
content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated app.ts allowedOrigins!');
