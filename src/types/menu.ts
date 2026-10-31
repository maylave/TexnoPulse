// src/types/menu.ts
import type { Component } from "vue";
export type MenuVariant = "compact" | "full";

export interface MenuActionItem {
  id: string;
  label?: string;
  icon?: string | Component; // Поддержка и компонентов lucide-vue-next
  shortcut?: string;
  action?: () => void;
  danger?: boolean;
  colorClass?: string;
  disabled?: boolean;
  separator?: boolean;

  variant?: MenuVariant;
}
