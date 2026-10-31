// src/types/toolbar.types.ts
import type { Component } from "vue";

export type EditorAction =
  | "variant"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "align"
  | "list"
  | "ordered_list"
  | "todo"
  | "table"
  | "link"
  | "image"
  | "video"
  | "audio"
  | "file"
  | "divider"
  | "code_block"
  | "text_block"
  | "canvas" // 🌟 Добавлено для интерактивного холста / блок-схем
  | "highlight"
  | "theme"
  | "duplicate_block"
  | "delete_block"
  | "spellcheck"
  | "ai_fix";

interface ToolbarItemBase {
  id: string;
  label: string;
  action: EditorAction;
}

export interface ToolbarButtonItem extends ToolbarItemBase {
  type: "button";
  icon: Component;
  value?: unknown;
  shortcut?: string;
}

export interface ToolbarSelectItem extends ToolbarItemBase {
  type: "select";
  defaultValue: string;
  options: { value: string; label: string }[];
}

export type ToolbarItem = ToolbarButtonItem | ToolbarSelectItem;

export interface ToolbarGroup {
  id: string;
  items: ToolbarItem[];
}

export interface ToolbarTab {
  id: string;
  label: string;
  groups: ToolbarGroup[];
}
