// src/components/editor/editor.blocks.ts
import type {
  BlockHighlight,
  ChecklistBlock,
  ChecklistItem,
  CodeBlock,
  DividerBlock,
  EditorBlock,
  EditorTheme,
  TableBlock,
  TextBlock,
} from "@/types/editor.types";

export const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

export const createText = (text = ""): TextBlock => ({
  id: uid(),
  type: "text",
  variant: "normal",
  align: "left",
  text,
  highlight: "none",
});

export const createCode = (): CodeBlock => ({
  id: uid(),
  type: "code",
  language: "plaintext",
  fileName: "",
  code: "",
  highlight: "none",
});

export const createChecklistItem = (): ChecklistItem => ({
  id: uid(),
  text: "",
  done: false,
});

export const createChecklist = (): ChecklistBlock => ({
  id: uid(),
  type: "checklist",
  items: [createChecklistItem()],
  highlight: "none",
});

export const createTable = (rows = 3, cols = 3): TableBlock => ({
  id: uid(),
  type: "table",
  rows: Array.from({ length: rows }, () => Array<string>(cols).fill("")),
  highlight: "none",
});

export const createDivider = (): DividerBlock => ({
  id: uid(),
  type: "divider",
  highlight: "none",
});

export const createFromFile = (file: File): EditorBlock => {
  const src = URL.createObjectURL(file);
  const base = {
    id: uid(),
    name: file.name,
    src,
    file,
    highlight: "none" as BlockHighlight,
  };

  if (file.type.startsWith("image/")) return { ...base, type: "image" };
  if (file.type.startsWith("video/")) return { ...base, type: "video" };
  if (file.type.startsWith("audio/")) return { ...base, type: "audio" };

  return {
    ...base,
    type: "file",
    size: file.size,
    mime: file.type || "application/octet-stream",
  };
};

export const releaseBlock = (block: EditorBlock) => {
  if ("src" in block) URL.revokeObjectURL(block.src);
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`;
  const units = ["КБ", "МБ", "ГБ"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
};

export const CODE_LANGUAGES = [
  { value: "plaintext", label: "Текст" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "vue", label: "Vue" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "python", label: "Python" },
  { value: "dart", label: "Dart" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
];

export const BLOCK_HIGHLIGHTS: {
  value: BlockHighlight;
  label: string;
  dot: string;
}[] = [
  { value: "none", label: "Без выделения", dot: "bg-white/20" },
  { value: "blue", label: "Синий акцент", dot: "bg-sky-400" },
  { value: "emerald", label: "Изумрудный", dot: "bg-emerald-400" },
  { value: "amber", label: "Янтарный", dot: "bg-amber-400" },
  { value: "rose", label: "Розовый", dot: "bg-rose-400" },
  { value: "violet", label: "Фиолетовый", dot: "bg-violet-400" },
  { value: "slate", label: "Нейтральный", dot: "bg-slate-400" },
];

export const EDITOR_THEMES: {
  value: EditorTheme;
  label: string;
  preview: string;
}[] = [
  { value: "aether", label: "Aether Glass", preview: "#0d1c2d" },
  { value: "obsidian", label: "Obsidian Dark", preview: "#16161d" },
  { value: "nord", label: "Nord Frost", preview: "#2e3440" },
  { value: "paper", label: "Warm Paper", preview: "#faf8f5" },
];
// В src/components/editor/editor.blocks.ts добавь импорт CanvasBlock из "@/types/editor.types"

export const createCanvas = (): CanvasBlock => {
  const n1 = uid();
  const n2 = uid();
  return {
    id: uid(),
    type: "canvas",
    height: 360,
    highlight: "none",
    nodes: [
      {
        id: n1,
        kind: "round",
        x: 60,
        y: 120,
        w: 140,
        h: 64,
        text: "Клиент (Vue)",
        color: "#38bdf8",
      },
      {
        id: n2,
        kind: "diamond",
        x: 310,
        y: 105,
        w: 150,
        h: 94,
        text: "Проверка ИИ",
        color: "#a78bfa",
      },
    ],
    edges: [
      {
        id: uid(),
        from: n1,
        to: n2,
        label: "JSON AST",
        color: "#38bdf8",
      },
    ],
    strokes: [],
  };
};
