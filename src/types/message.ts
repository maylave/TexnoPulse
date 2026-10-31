// src/types/message.ts
export type MessageContentType =
  | "text"
  | "file"
  | "sticker"
  | "color"
  | "code"
  | "image"
  | "audio"
  | "video"
  | "checklist"
  | "table"
  | "divider"
  | "canvas" // 🌟 Добавлено для холста / блок-схем
  | "poll";

export type TextVariant = "normal" | "h1" | "h2" | "quote";
export type TextAlign = "left" | "center" | "right";
export type BlockHighlight =
  | "none"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "slate";

export interface MessageContent {
  type: MessageContentType;
  highlight?: BlockHighlight;
}

export interface TextContent extends MessageContent {
  type: "text";
  text: string;
  variant?: TextVariant;
  align?: TextAlign;
}

export interface FileContent extends MessageContent {
  type: "file";
  name: string;
  size: string;
  url?: string;
  fileId?: string;
}

export interface ColorContent extends MessageContent {
  type: "color";
  value: string;
  label?: string;
}

export interface CodeContent extends MessageContent {
  type: "code";
  language: string;
  fileName: string;
  code: string;
}

export interface ImageContent extends MessageContent {
  type: "image";
  url: string;
  alt?: string;
  fileId?: string;
}

export interface AudioContent extends MessageContent {
  type: "audio";
  url: string;
  duration?: number;
  fileId?: string;
}

export interface VideoContent extends MessageContent {
  type: "video";
  url: string;
  thumbnail?: string;
  fileId?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
}

export interface ChecklistContent extends MessageContent {
  type: "checklist";
  title?: string;
  items: ChecklistItem[];
}

export interface TableContent extends MessageContent {
  type: "table";
  rows: string[][];
}

export interface DividerContent extends MessageContent {
  type: "divider";
}

// 🌟 Интерфейс для интерактивного холста (блок-схем)
export interface CanvasContent extends MessageContent {
  type: "canvas";
  height?: number;
  nodes: any[];
  edges: any[];
  strokes: any[];
}

export interface PollOption {
  id: string;
  text: string;
  votes?: number;
  isSelected?: boolean;
}

export interface PollContent extends MessageContent {
  type: "poll";
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
}

export interface StickerContent extends MessageContent {
  type: "sticker";
  url: string;
}

export type AnyMessageContent =
  | TextContent
  | FileContent
  | StickerContent
  | ColorContent
  | CodeContent
  | ImageContent
  | AudioContent
  | VideoContent
  | ChecklistContent
  | TableContent
  | DividerContent
  | CanvasContent
  | PollContent;

export interface Message {
  id: string;
  chatId: string;
  content: AnyMessageContent[];
  timestamp: Date;
  isOwn: boolean;
  sender?: string;
}
