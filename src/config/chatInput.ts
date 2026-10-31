// src/config/chatInput.ts
import type { MenuActionItem } from "@/types/menu";
import {
  Image,
  FileText,
  Video,
  Camera,
  Mic,
  Link,
  Code,
  Palette,
  ListTodo,
} from "lucide-vue-next";
import type { Component } from "vue";

// --- Единый тип для любых вложений (файлы, код, цвета, списки, ссылки) ---
export type AttachmentKind =
  | "file"
  | "code"
  | "color"
  | "todo"
  | "link"
  | "voice";

export interface TodoItem {
  text: string;
  done: boolean;
}

export interface ChatAttachment {
  id: string;
  kind: AttachmentKind;
  title: string;
  subtitle?: string;
  // Специфичные поля для разных типов:
  file?: File;
  size?: number;
  mimeType?: string;
  previewUrl?: string;
  code?: { language: string; content: string };
  color?: string; // Например, "#8b5cf6"
  todoList?: TodoItem[];
  url?: string;
}

// --- Колбэки для меню ---
export interface AttachmentHandlers {
  onPickPhoto: () => void;
  onPickVideo: () => void;
  onPickFile: () => void;
  onAddCode: () => void;
  onAddColor: () => void;
  onAddTodo: () => void;
  onAddLink: () => void;
  onCamera?: () => void;
  onVoice?: () => void;
}

export interface PickerActionItem {
  id: string;
  label: string;
  icon: Component;
  action: () => void;
}

/** Компактное меню (обычный список) */
export const getCompactAttachmentItems = (
  handlers: AttachmentHandlers,
): MenuActionItem[] => [
  {
    id: "image",
    label: "Фото или видео",
    icon: Image as unknown as string,
    action: handlers.onPickPhoto,
    variant: "compact" as const,
  },
  {
    id: "file",
    label: "Файл",
    icon: FileText as unknown as string,
    action: handlers.onPickFile,
    variant: "compact" as const,
  },
  {
    id: "code",
    label: "Сниппет кода",
    icon: Code as unknown as string,
    action: handlers.onAddCode,
    variant: "compact" as const,
  },
  {
    id: "color",
    label: "Палитра / Цвет",
    icon: Palette as unknown as string,
    action: handlers.onAddColor,
    variant: "compact" as const,
  },
  {
    id: "todo",
    label: "Чек-лист",
    icon: ListTodo as unknown as string,
    action: handlers.onAddTodo,
    variant: "compact" as const,
  },
];

/** Полное квадратное меню (сетка иконок) — теперь с рабочими action! */
export const getFullAttachmentItems = (
  handlers: AttachmentHandlers,
): PickerActionItem[] => [
  { id: "photo", label: "Фото", icon: Image, action: handlers.onPickPhoto },
  { id: "video", label: "Видео", icon: Video, action: handlers.onPickVideo },
  { id: "file", label: "Файл", icon: FileText, action: handlers.onPickFile },
  { id: "code", label: "Код", icon: Code, action: handlers.onAddCode },
  { id: "color", label: "Цвет", icon: Palette, action: handlers.onAddColor },
  { id: "todo", label: "Список", icon: ListTodo, action: handlers.onAddTodo },
  { id: "link", label: "Ссылка", icon: Link, action: handlers.onAddLink },
  {
    id: "camera",
    label: "Камера",
    icon: Camera,
    action: handlers.onCamera ?? handlers.onPickPhoto,
  },
  {
    id: "voice",
    label: "Голосовое",
    icon: Mic,
    action: handlers.onVoice ?? (() => {}),
  },
];

export const DEFAULT_USE_BIG_PICKER = true;
