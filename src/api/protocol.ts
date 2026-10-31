// src/api/protocol.ts
import type { AnyMessageContent } from "@/types/message";

export interface ChatNode {
  id: string;
  [key: string]: unknown; // уточни под схему nodes
}

export interface DeviceInfo {
  deviceId: string;
  status: "trusted" | "pending" | "blocked";
  [key: string]: unknown;
}

/** То, что лежит в поле content сообщения на беке */
export interface MessageContent {
  blocks: AnyMessageContent[];
  createdAt?: number; // бек проставляет сам, если не передать
}

/** Сообщение в том виде, в каком его отдаёт бек. Сверь поля со схемой таблицы messages */
export interface ServerMessage {
  id: string | number;
  chatId: string;
  senderId: string;
  content: MessageContent | string; // строка, если в БД это text-колонка
  createdAt?: number | string;
}

export interface ApiActions {
  "app:me": {
    req: void;
    res: { deviceId: string; accountId: string; userName: string };
  };

  "chat:load": { req: void; res: ChatNode[] };
  "chat:create": {
    req: {
      parentId: string;
      type: "folder" | "chat";
      name: string;
      metadata?: Record<string, unknown> | null;
    };
    res: ChatNode;
  };
  "chat:update": {
    req: {
      id: string;
      updates: Partial<{ name: string; metadata: Record<string, unknown> }>;
    };
    res: { success: boolean };
  };
  "chat:move": {
    req: { id: string; newParentId: string | null };
    res: { success: boolean };
  };
  "chat:delete": { req: { id: string }; res: { success: boolean } };

  "message:load": {
    req: { chatId: string; limit?: number; offset?: number };
    res: ServerMessage[];
  };
  "message:send": {
    req: { chatId: string; content: MessageContent };
    res: ServerMessage;
  };
  "message:edit": {
    req: { messageId: string; newContent: MessageContent };
    res: unknown;
  };
  "message:delete": {
    req: { messageId: string; chatId: string };
    res: { success: boolean };
  };

  "device:approve": { req: { deviceId: string }; res: { success: boolean } };
  "device:block": { req: { deviceId: string }; res: { success: boolean } };

  "notification:send": {
    req: {
      title: string;
      body: string;
      type?: "startup" | "message" | "device" | "system";
      sound?: boolean;
    };
    res: { success: boolean };
  };
  "notification:test": {
    req: void;
    res: { success: boolean };
  };
  "settings:notifications:get": {
    req: void;
    res: {
      enabled: boolean;
      sound: boolean;
      startup: boolean;
      messages: boolean;
      devices: boolean;
    };
  };
  "settings:notifications:update": {
    req: Partial<{
      enabled: boolean;
      sound: boolean;
      startup: boolean;
      messages: boolean;
      devices: boolean;
    }>;
    res: { success: boolean };
  };
}

export interface ServerEvents {
  "app:error": { message: string; details?: unknown; timestamp: number };
  "app:success": { action: string; message: string };
  "app:loading": {
    processName: string;
    progress: number;
    status: "started" | "in_progress" | "completed" | "failed";
  };
  "file:transfer": {
    fileId: string;
    fileName: string;
    progress: number;
    type: "upload" | "download";
    status: "started" | "transferring" | "completed" | "error";
  };
  "app:sync": {
    entity: "device" | "chat" | "messages" | "database";
    status: "syncing" | "synced" | "failed";
    meta?: unknown;
  };

  "chat:created": { node: ChatNode };
  "chat:updated": { id: string; updates: Record<string, unknown> };
  "chat:moved": { id: string; newParentId: string | null };
  "chat:deleted": { id: string };

  "message:new": { chatId: string; message: ServerMessage };
  "message:edited": { messageId: string; newContent: MessageContent };
  "message:deleted": { messageId: string; chatId: string };
  "message:read": { messageIds: string[] };

  "device:permission-request": { device: DeviceInfo };
  "device:online": { device: DeviceInfo };
  "device:status-changed": { deviceId: string; status: DeviceInfo["status"] };
}
