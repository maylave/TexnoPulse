// src/types/editor.types.ts

// Добавь в src/types/editor.types.ts:

export type CanvasShapeKind =
  | "rect"
  | "round"
  | "diamond"
  | "triangle"
  | "circle"
  | "text";

export interface CanvasNode {
  id: string;
  kind: CanvasShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
}

export interface CanvasEdge {
  id: string;
  from: string; // id начальной фигуры
  to: string; // id конечной фигуры
  label?: string;
  color?: string;
}

export interface CanvasStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface CanvasBlock extends BaseBlock {
  type: "canvas";
  height: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  strokes: CanvasStroke[];
  svgPreview?: string; // готовый SVG для рендера в чате
}

// И обнови тип EditorBlock (добавь | CanvasBlock):

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

export type EditorTheme = "aether" | "obsidian" | "nord" | "paper";

interface BaseBlock {
  id: string;
  highlight?: BlockHighlight;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  variant: TextVariant;
  align: TextAlign;
  text: string;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  language: string;
  fileName: string;
  code: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistBlock extends BaseBlock {
  type: "checklist";
  items: ChecklistItem[];
}

export interface TableBlock extends BaseBlock {
  type: "table";
  rows: string[][];
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface MediaBlockBase extends BaseBlock {
  name: string;
  src: string;
  file?: File;
}

export interface ImageBlock extends MediaBlockBase {
  type: "image";
}

export interface VideoBlock extends MediaBlockBase {
  type: "video";
}

export interface AudioBlock extends MediaBlockBase {
  type: "audio";
}

export interface FileBlock extends MediaBlockBase {
  type: "file";
  size: number;
  mime: string;
}

export type EditorBlock =
  | TextBlock
  | CodeBlock
  | ChecklistBlock
  | TableBlock
  | DividerBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | FileBlock
  | CanvasBlock;
