<!-- src/components/editor/canvas/CanvasBlockEditor.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import {
  MousePointer,
  Square,
  Circle,
  Triangle,
  Diamond,
  Type,
  ArrowUpRight,
  Pencil,
  Trash2,
  Eraser,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-vue-next";
import { uid } from "../editor.blocks";
import type {
  CanvasBlock,
  CanvasNode,
  CanvasShapeKind,
} from "@/types/editor.types";

const block = defineModel<CanvasBlock>({ required: true });

type ToolMode = "select" | "hand" | "connect" | "draw" | CanvasShapeKind;

const activeTool = ref<ToolMode>("select");
const activeColor = ref("#38bdf8");
const selectedNodeId = ref<string | null>(null);
const selectedEdgeId = ref<string | null>(null);
const editingNodeId = ref<string | null>(null);
const connectFromId = ref<string | null>(null);

// Состояние зума и панорамирования (Figma-style)
const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });

const svgRef = ref<SVGSVGElement | null>(null);

const dragState = ref<{
  mode: "move" | "resize";
  nodeId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
} | null>(null);

const currentStrokeId = ref<string | null>(null);

const PALETTE = [
  "#38bdf8", // Sky
  "#34d399", // Emerald
  "#fbbf24", // Amber
  "#fb7185", // Rose
  "#a78bfa", // Violet
  "#94a3b8", // Slate
];

const TOOLS: { id: ToolMode; label: string; icon: any }[] = [
  { id: "select", label: "Курсор", icon: MousePointer },
  { id: "hand", label: "Рука (Панорамирование)", icon: Hand },
  { id: "rect", label: "Прямоугольник", icon: Square },
  { id: "round", label: "Скругленный блок", icon: Square },
  { id: "diamond", label: "Ромб", icon: Diamond },
  { id: "triangle", label: "Треугольник", icon: Triangle },
  { id: "circle", label: "Круг", icon: Circle },
  { id: "text", label: "Текст", icon: Type },
  { id: "connect", label: "Стрелка", icon: ArrowUpRight },
  { id: "draw", label: "Карандаш", icon: Pencil },
];

// Перевод координат экрана в виртуальные координаты холста с учетом зума и пановы
const getVirtualCoords = (e: MouseEvent) => {
  const svg = svgRef.value;
  if (!svg) return { x: 0, y: 0 };
  const rect = svg.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;
  return {
    x: Math.round((clientX - pan.value.x) / zoom.value),
    y: Math.round((clientY - pan.value.y) / zoom.value),
  };
};

const onCanvasMouseDown = (e: MouseEvent) => {
  if (e.button !== 0 && e.button !== 1) return; // ЛКМ или колесико

  // Режим руки (панорамирование) или зажатое колесико мыши
  if (activeTool.value === "hand" || e.button === 1) {
    isPanning.value = true;
    panStart.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
    return;
  }

  const { x, y } = getVirtualCoords(e);
  editingNodeId.value = null;
  selectedEdgeId.value = null;

  if (activeTool.value === "draw") {
    const id = uid();
    currentStrokeId.value = id;
    block.value.strokes.push({
      id,
      color: activeColor.value,
      width: 2.5,
      points: [{ x, y }],
    });
    return;
  }

  if (
    ["rect", "round", "diamond", "triangle", "circle", "text"].includes(
      activeTool.value,
    )
  ) {
    const kind = activeTool.value as CanvasShapeKind;
    const isCircle = kind === "circle";
    const isText = kind === "text";
    const w = isCircle ? 84 : isText ? 120 : 140;
    const h = isCircle ? 84 : isText ? 36 : 64;

    const newNode: CanvasNode = {
      id: uid(),
      kind,
      x: Math.max(8, x - Math.round(w / 2)),
      y: Math.max(8, y - Math.round(h / 2)),
      w,
      h,
      text: isText ? "Подпись" : "Блок",
      color: activeColor.value,
    };

    block.value.nodes.push(newNode);
    selectedNodeId.value = newNode.id;
    editingNodeId.value = newNode.id;
    activeTool.value = "select";
    return;
  }

  selectedNodeId.value = null;
  connectFromId.value = null;
};

const onNodeMouseDown = (e: MouseEvent, node: CanvasNode) => {
  if (e.button !== 0) return;
  e.stopPropagation();

  if (activeTool.value === "connect") {
    if (!connectFromId.value) {
      connectFromId.value = node.id;
      selectedNodeId.value = node.id;
    } else if (connectFromId.value !== node.id) {
      block.value.edges.push({
        id: uid(),
        from: connectFromId.value,
        to: node.id,
        label: "",
        color: activeColor.value,
      });
      connectFromId.value = null;
      activeTool.value = "select";
    }
    return;
  }

  selectedNodeId.value = node.id;
  selectedEdgeId.value = null;

  const { x, y } = getVirtualCoords(e);
  dragState.value = {
    mode: "move",
    nodeId: node.id,
    startX: x,
    startY: y,
    origX: node.x,
    origY: node.y,
    origW: node.w,
    origH: node.h,
  };
};

const onResizeMouseDown = (e: MouseEvent, node: CanvasNode) => {
  if (e.button !== 0) return;
  e.stopPropagation();
  const { x, y } = getVirtualCoords(e);
  dragState.value = {
    mode: "resize",
    nodeId: node.id,
    startX: x,
    startY: y,
    origX: node.x,
    origY: node.y,
    origW: node.w,
    origH: node.h,
  };
};

const onCanvasMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    pan.value = {
      x: e.clientX - panStart.value.x,
      y: e.clientY - panStart.value.y,
    };
    return;
  }

  const { x, y } = getVirtualCoords(e);

  if (currentStrokeId.value) {
    const stroke = block.value.strokes.find(
      (s) => s.id === currentStrokeId.value,
    );
    if (stroke) stroke.points.push({ x, y });
    return;
  }

  if (!dragState.value) return;
  const st = dragState.value;
  const node = block.value.nodes.find((n) => n.id === st.nodeId);
  if (!node) return;

  const dx = x - st.startX;
  const dy = y - st.startY;

  if (st.mode === "move") {
    node.x = Math.max(4, st.origX + dx);
    node.y = Math.max(4, st.origY + dy);
  } else {
    node.w = Math.max(48, st.origW + dx);
    node.h = Math.max(32, st.origH + dy);
  }
};

const onCanvasMouseUp = () => {
  isPanning.value = false;
  dragState.value = null;
  currentStrokeId.value = null;
};

// Зум колесиком мыши (как в Figma)
const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  let newZoom =
    e.deltaY < 0 ? zoom.value * zoomFactor : zoom.value / zoomFactor;
  zoom.value = Math.min(Math.max(newZoom, 0.3), 3); // Ограничения от 30% до 300%
};

const resetZoom = () => {
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
};

const pickColor = (color: string) => {
  activeColor.value = color;
  if (selectedNodeId.value) {
    const n = block.value.nodes.find(
      (item) => item.id === selectedNodeId.value,
    );
    if (n) n.color = color;
  } else if (selectedEdgeId.value) {
    const edge = block.value.edges.find(
      (item) => item.id === selectedEdgeId.value,
    );
    if (edge) edge.color = color;
  }
};

const deleteSelected = () => {
  if (selectedNodeId.value) {
    const id = selectedNodeId.value;
    block.value.nodes = block.value.nodes.filter((n) => n.id !== id);
    block.value.edges = block.value.edges.filter(
      (e) => e.from !== id && e.to !== id,
    );
    selectedNodeId.value = null;
  } else if (selectedEdgeId.value) {
    block.value.edges = block.value.edges.filter(
      (e) => e.id !== selectedEdgeId.value,
    );
    selectedEdgeId.value = null;
  }
};

const clearCanvas = () => {
  block.value.nodes = [];
  block.value.edges = [];
  block.value.strokes = [];
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
};

const diamondPoints = (n: CanvasNode) =>
  `${n.x + n.w / 2},${n.y} ${n.x + n.w},${n.y + n.h / 2} ${n.x + n.w / 2},${n.y + n.h} ${n.x},${n.y + n.h / 2}`;

const trianglePoints = (n: CanvasNode) =>
  `${n.x + n.w / 2},${n.y} ${n.x + n.w},${n.y + n.h} ${n.x},${n.y + n.h}`;

const computedEdges = computed(() =>
  block.value.edges
    .map((edge) => {
      const from = block.value.nodes.find((n) => n.id === edge.from);
      const to = block.value.nodes.find((n) => n.id === edge.to);
      if (!from || !to) return null;

      const x1 = from.x + from.w / 2;
      const y1 = from.y + from.h / 2;
      const x2 = to.x + to.w / 2;
      const y2 = to.y + to.h / 2;

      return {
        ...edge,
        x1,
        y1,
        x2,
        y2,
        mx: (x1 + x2) / 2,
        my: (y1 + y2) / 2,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null),
);

const strokePath = (points: { x: number; y: number }[]) =>
  points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
</script>

<template>
  <div
    class="my-2 overflow-hidden rounded-2xl border border-white/10 bg-black/30 select-none shadow-xl"
  >
    <!-- Тулбар холста + Управление зумом в стиле Figma -->
    <div
      class="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[0.02] px-3 py-2"
    >
      <button
        v-for="t in TOOLS"
        :key="t.id"
        type="button"
        :title="t.label"
        class="flex size-7 items-center justify-center rounded-lg text-xs transition-all cursor-pointer"
        :class="
          activeTool === t.id
            ? 'bg-accent text-white shadow-sm shadow-accent/30'
            : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'
        "
        @click="
          activeTool = t.id;
          connectFromId = null;
        "
      >
        <span
          v-if="t.id === 'round'"
          class="size-3.5 rounded border-2 border-current"
        />
        <component :is="t.icon" v-else class="size-3.5" />
      </button>

      <div class="mx-1 h-4 w-px bg-white/10" />

      <!-- Палитра цветов -->
      <div class="flex items-center gap-1">
        <button
          v-for="c in PALETTE"
          :key="c"
          type="button"
          class="size-4 rounded-full border transition-transform hover:scale-125 cursor-pointer"
          :class="
            activeColor === c
              ? 'border-white scale-110 ring-2 ring-white/30'
              : 'border-white/20'
          "
          :style="{ backgroundColor: c }"
          @click="pickColor(c)"
        />
      </div>

      <span
        v-if="activeTool === 'connect'"
        class="ml-2 text-[11px] text-accent animate-pulse"
      >
        {{
          connectFromId ? "Кликните на 2-ю фигуру…" : "Кликните на 1-ю фигуру…"
        }}
      </span>

      <!-- Figma-стиль: зум и сброс вида в правой части тулбара -->
      <div
        class="ml-auto flex items-center gap-1.5 text-xs text-on-surface-variant"
      >
        <button
          type="button"
          title="Уменьшить масштаб"
          class="flex size-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-on-surface cursor-pointer"
          @click="zoom = Math.max(0.3, zoom - 0.15)"
        >
          <ZoomOut class="size-3.5" />
        </button>
        <span class="w-10 text-center font-mono text-[11px]"
          >{{ Math.round(zoom * 100) }}%</span
        >
        <button
          type="button"
          title="Увеличить масштаб"
          class="flex size-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-on-surface cursor-pointer"
          @click="zoom = Math.min(3, zoom + 0.15)"
        >
          <ZoomIn class="size-3.5" />
        </button>
        <button
          type="button"
          title="Сбросить масштаб и положение"
          class="flex size-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-on-surface cursor-pointer"
          @click="resetZoom"
        >
          <RotateCcw class="size-3.5" />
        </button>

        <div class="mx-1 h-4 w-px bg-white/10" />

        <button
          v-if="selectedNodeId || selectedEdgeId"
          type="button"
          title="Удалить выбранное"
          class="flex size-7 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
          @click="deleteSelected"
        >
          <Trash2 class="size-3.5" />
        </button>

        <button
          type="button"
          title="Очистить холст"
          class="flex size-7 items-center justify-center rounded-lg text-on-surface-variant/70 hover:bg-white/10 hover:text-on-surface cursor-pointer"
          @click="clearCanvas"
        >
          <Eraser class="size-3.5" />
        </button>
      </div>
    </div>

    <!-- Большое рабочее пространство с поддержкой панорамирования и зума -->
    <div
      class="relative w-full overflow-hidden min-h-[520px]"
      :style="{ height: `${block.height || 560}px` }"
    >
      <svg
        ref="svgRef"
        width="100%"
        height="100%"
        class="block w-full h-full min-h-[520px]"
        :class="
          activeTool === 'hand' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : 'cursor-crosshair'
        "
        @mousedown="onCanvasMouseDown"
        @mousemove="onCanvasMouseMove"
        @mouseup="onCanvasMouseUp"
        @mouseleave="onCanvasMouseUp"
        @wheel="onWheel"
      >
        <defs>
          <pattern
            id="aether-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
            :patternTransform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`"
          >
            <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.1)" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#aether-grid)" />

        <!-- Основной контейнер с масштабированием и сдвигом (Figma viewport) -->
        <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
          <!-- 1. Стрелки -->
          <g v-for="edge in computedEdges" :key="edge.id">
            <line
              :x1="edge.x1"
              :y1="edge.y1"
              :x2="edge.x2"
              :y2="edge.y2"
              :stroke="edge.color || '#38bdf8'"
              :stroke-width="selectedEdgeId === edge.id ? 3 / zoom : 2 / zoom"
              class="cursor-pointer transition-all"
              @mousedown.stop="
                selectedEdgeId = edge.id;
                selectedNodeId = null;
              "
            />
            <line
              :x1="edge.x1"
              :y1="edge.y1"
              :x2="edge.x2"
              :y2="edge.y2"
              stroke="transparent"
              stroke-width="16"
              class="cursor-pointer"
              @mousedown.stop="
                selectedEdgeId = edge.id;
                selectedNodeId = null;
              "
            />
            <circle
              :cx="edge.mx"
              :cy="edge.my"
              :r="4 / zoom"
              :fill="edge.color || '#38bdf8'"
            />
          </g>

          <!-- 2. Рисунки от руки -->
          <path
            v-for="stroke in block.strokes"
            :key="stroke.id"
            :d="strokePath(stroke.points)"
            :stroke="stroke.color"
            :stroke-width="stroke.width / zoom"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- 3. Блоки и фигуры -->
          <g
            v-for="node in block.nodes"
            :key="node.id"
            class="cursor-move"
            @mousedown="onNodeMouseDown($event, node)"
            @dblclick.stop="editingNodeId = node.id"
          >
            <rect
              v-if="node.kind === 'rect' || node.kind === 'round'"
              :x="node.x"
              :y="node.y"
              :width="node.w"
              :height="node.h"
              :rx="node.kind === 'round' ? 16 : 4"
              :fill="`${node.color}22`"
              :stroke="node.color"
              :stroke-width="(selectedNodeId === node.id ? 2.5 : 1.5) / zoom"
            />

            <ellipse
              v-else-if="node.kind === 'circle'"
              :cx="node.x + node.w / 2"
              :cy="node.y + node.h / 2"
              :rx="node.w / 2"
              :ry="node.h / 2"
              :fill="`${node.color}22`"
              :stroke="node.color"
              :stroke-width="(selectedNodeId === node.id ? 2.5 : 1.5) / zoom"
            />

            <polygon
              v-else-if="node.kind === 'diamond'"
              :points="diamondPoints(node)"
              :fill="`${node.color}22`"
              :stroke="node.color"
              :stroke-width="(selectedNodeId === node.id ? 2.5 : 1.5) / zoom"
            />

            <polygon
              v-else-if="node.kind === 'triangle'"
              :points="trianglePoints(node)"
              :fill="`${node.color}22`"
              :stroke="node.color"
              :stroke-width="(selectedNodeId === node.id ? 2.5 : 1.5) / zoom"
            />

            <foreignObject
              :x="node.x + 6"
              :y="node.y + 6"
              :width="Math.max(20, node.w - 12)"
              :height="Math.max(20, node.h - 12)"
            >
              <div
                class="flex size-full items-center justify-center text-center"
              >
                <input
                  v-if="editingNodeId === node.id"
                  v-model="node.text"
                  autofocus
                  class="w-full rounded bg-black/80 px-1 py-0.5 text-center text-xs text-white outline-none border border-accent shadow-lg"
                  @mousedown.stop
                  @keydown.enter.stop="editingNodeId = null"
                  @blur="editingNodeId = null"
                />
                <span
                  v-else
                  class="px-1 text-xs font-medium leading-tight break-words"
                  :style="{
                    color: node.kind === 'text' ? node.color : '#e2e8f0',
                  }"
                >
                  {{ node.text }}
                </span>
              </div>
            </foreignObject>

            <rect
              v-if="selectedNodeId === node.id"
              :x="node.x + node.w - 6 / zoom"
              :y="node.y + node.h - 6 / zoom"
              :width="12 / zoom"
              :height="12 / zoom"
              rx="2"
              fill="#fff"
              :stroke="node.color"
              :stroke-width="2 / zoom"
              class="cursor-se-resize"
              @mousedown="onResizeMouseDown($event, node)"
            />
          </g>
        </g>
      </svg>

      <!-- Подсказка по управлению в стиле Figma -->
      <div
        class="pointer-events-none absolute bottom-3 left-4 flex items-center gap-3 text-[11px] text-on-surface-variant/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md"
      >
        <span>✋ Колесико мыши — зум</span>
        <span>·</span>
        <span>🖱️ Инструмент «Рука» / Средняя кнопка — панорама</span>
      </div>
    </div>
  </div>
</template>
