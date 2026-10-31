import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

function getDatabasePath(): string {
  const baseDir = process.env.APPDATA || 
    (process.platform === 'darwin'
      ? path.join(process.env.HOME || '', 'Library/Application Support')
      : path.join(process.env.HOME || '', '.config'));
  
  const snapiDir = path.join(baseDir, 'Snapi');
  if (!fs.existsSync(snapiDir)) {
    fs.mkdirSync(snapiDir, { recursive: true });
  }

  const dbPath = path.join(snapiDir, 'local.db');

  // Если БД в APPDATA еще нет, но рядом есть локальный local.db, копируем его
  if (!fs.existsSync(dbPath)) {
    const localFallback = path.join(process.cwd(), 'local.db');
    if (fs.existsSync(localFallback)) {
      try {
        fs.copyFileSync(localFallback, dbPath);
        console.log(`[DB] Скопирована исходная база из ${localFallback} в ${dbPath}`);
      } catch (e) {
        console.warn(`[DB] Не удалось скопировать локальную базу:`, e);
      }
    }
  }

  console.log(`[DB] База данных: ${dbPath}`);
  return dbPath;
}

const sqlite = new Database(getDatabasePath())

// Автоматическая инициализация таблиц при первом старте
sqlite.exec(`
CREATE TABLE IF NOT EXISTS users_table (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	account_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS nodes (
	id TEXT PRIMARY KEY,
	parent_id TEXT,
	type TEXT NOT NULL,
	name TEXT NOT NULL,
	metadata TEXT,
	CONSTRAINT fk_nodes_parent_id_nodes_id_fk FOREIGN KEY (parent_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS messages (
	mid INTEGER NOT NULL,
	device_id TEXT NOT NULL,
	node_id TEXT NOT NULL,
	content TEXT,
	CONSTRAINT messages_pk PRIMARY KEY(mid, device_id),
	CONSTRAINT fk_messages_node_id_nodes_id_fk FOREIGN KEY (node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS device_table (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	device_id TEXT NOT NULL UNIQUE,
	account_id TEXT NOT NULL,
	ip_address TEXT NOT NULL,
	type_device TEXT DEFAULT 'other' NOT NULL,
	status TEXT DEFAULT 'pending' NOT NULL,
	CONSTRAINT fk_device_table_account_id_users_table_account_id_fk FOREIGN KEY (account_id) REFERENCES users_table(account_id)
);

CREATE TABLE IF NOT EXISTS settings_chat_table (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	settings_json TEXT NOT NULL
);
`)

export const db = drizzle({ client: sqlite })
