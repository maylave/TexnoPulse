const Database = require('better-sqlite3');
const db = new Database('C:/Users/Mi/snapi-app/server/local.db');
const tables = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL").all();
console.log(tables.map(t => t.sql).join(';\n\n'));
