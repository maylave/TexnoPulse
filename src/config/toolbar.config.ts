// src/config/toolbar.config.ts
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Link,
  Image as ImageIcon,
  Video,
  Music,
  Paperclip,
  Minus,
  Braces,
  Sparkles,
  Type,
  Workflow,
} from "lucide-vue-next";

import type { ToolbarButtonItem, ToolbarTab } from "@/types/toolbar.types";

export const TOOLBAR_TABS: ToolbarTab[] = [
  {
    id: "home",
    label: "Главная",
    groups: [
      {
        id: "block",
        items: [
          {
            type: "select",
            id: "variant",
            label: "Тип блока",
            action: "variant",
            defaultValue: "normal",
            options: [
              { value: "normal", label: "Абзац" },
              { value: "h1", label: "Заголовок 1 (H1)" },
              { value: "h2", label: "Заголовок 2 (H2)" },
              { value: "quote", label: "Цитата" },
            ],
          },
        ],
      },
      {
        id: "inline",
        items: [
          {
            type: "button",
            id: "bold",
            label: "Жирный",
            shortcut: "Ctrl+B",
            action: "bold",
            icon: Bold,
          },
          {
            type: "button",
            id: "italic",
            label: "Курсив",
            shortcut: "Ctrl+I",
            action: "italic",
            icon: Italic,
          },
          {
            type: "button",
            id: "underline",
            label: "Подчёркнутый",
            shortcut: "Ctrl+U",
            action: "underline",
            icon: Underline,
          },
          {
            type: "button",
            id: "strike",
            label: "Зачёркнутый",
            action: "strike",
            icon: Strikethrough,
          },
          {
            type: "button",
            id: "code",
            label: "Код в строке",
            action: "code",
            icon: Code,
          },
        ],
      },
      {
        id: "align",
        items: [
          {
            type: "button",
            id: "align-left",
            label: "По левому краю",
            action: "align",
            value: "left",
            icon: AlignLeft,
          },
          {
            type: "button",
            id: "align-center",
            label: "По центру",
            action: "align",
            value: "center",
            icon: AlignCenter,
          },
          {
            type: "button",
            id: "align-right",
            label: "По правому краю",
            action: "align",
            value: "right",
            icon: AlignRight,
          },
        ],
      },
      {
        id: "lists",
        items: [
          {
            type: "button",
            id: "list",
            label: "Маркированный список",
            action: "list",
            icon: List,
          },
          {
            type: "button",
            id: "ordered-list",
            label: "Нумерованный список",
            action: "ordered_list",
            icon: ListOrdered,
          },
          {
            type: "button",
            id: "todo",
            label: "Чек-лист",
            action: "todo",
            icon: CheckSquare,
          },
        ],
      },
    ],
  },
  {
    id: "insert",
    label: "Вставка",
    groups: [
      {
        id: "blocks",
        items: [
          {
            type: "button",
            id: "text-block",
            label: "Текстовый блок",
            shortcut: "Enter",
            action: "text_block",
            icon: Type,
          },
          {
            type: "button",
            id: "code-block",
            label: "Блок кода",
            action: "code_block",
            icon: Braces,
          },
          {
            type: "button",
            id: "table",
            label: "Таблица",
            action: "table",
            icon: Table,
          },
          {
            type: "button",
            id: "divider",
            label: "Разделитель",
            action: "divider",
            icon: Minus,
          },
          {
            type: "button",
            id: "canvas-block",
            label: "Холст / Блок-схема",
            action: "canvas",
            icon: Workflow,
          },
        ],
      },
      {
        id: "media",
        items: [
          {
            type: "button",
            id: "image",
            label: "Изображение",
            action: "image",
            icon: ImageIcon,
          },
          {
            type: "button",
            id: "video",
            label: "Видео",
            action: "video",
            icon: Video,
          },
          {
            type: "button",
            id: "audio",
            label: "Аудио",
            action: "audio",
            icon: Music,
          },
          {
            type: "button",
            id: "file",
            label: "Файл",
            action: "file",
            icon: Paperclip,
          },
        ],
      },
      {
        id: "links",
        items: [
          {
            type: "button",
            id: "link",
            label: "Ссылка",
            shortcut: "Ctrl+K",
            action: "link",
            icon: Link,
          },
        ],
      },
    ],
  },
];

export const TOOLBAR_AI_ITEM: ToolbarButtonItem = {
  type: "button",
  id: "ai-fix",
  label: "Исправить орфографию и форматировать через ИИ",
  action: "ai_fix",
  icon: Sparkles,
};
