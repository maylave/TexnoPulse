// back/src/db/sqema.ts
import {
  int,
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export const deviceTypes = [
  "phone",
  "pc",
  "laptop",
  "tablet",
  "other",
] as const;
export type DeviceType = (typeof deviceTypes)[number];

export const deviceStatuses = ["trusted", "pending", "blocked"] as const;
export type DeviceStatus = (typeof deviceStatuses)[number];

// --- ТАБЛИЦЫ ---

export const usersTable = sqliteTable("users_table", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // Уникальный идентификатор аккаунта (хеш)
  accountId: text("account_id").notNull().unique(),
});

export const nodes = sqliteTable("nodes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Добавлено каскадное удаление для вложенных папок/чатов
  parentId: text("parent_id").references((): AnySQLiteColumn => nodes.id, {
    onDelete: "cascade",
  }),

  type: text("type", { enum: ["folder", "chat"] }).notNull(),
  name: text("name").notNull(),

  metadata: text("metadata", { mode: "json" }),
});

export const messages = sqliteTable(
  "messages",
  {
    mid: integer("mid").notNull(),
    deviceId: text("device_id").notNull(),

    // Добавлено каскадное удаление: при удалении узла/чата сообщения стираются автоматически
    nodeId: text("node_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),

    content: text("content", { mode: "json" }),
  },

  (table) => [primaryKey({ columns: [table.mid, table.deviceId] })],
);

export const deviceTable = sqliteTable("device_table", {
  id: int("id").primaryKey({ autoIncrement: true }),

  // Уникальный ID устройства (транслируется через Bonjour)
  deviceId: text("device_id").notNull().unique(),

  accountId: text("account_id")
    .notNull()
    .references(() => usersTable.accountId),

  ipAddress: text("ip_address").notNull(),
  typeDevice: text("type_device", { enum: deviceTypes })
    .notNull()
    .default("other"),
  status: text("status", { enum: deviceStatuses }).notNull().default("pending"),
});

export const SettingsChatTable = sqliteTable("settings_chat_table", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  settings: text("settings_json", { mode: "json" }).notNull(),
});
