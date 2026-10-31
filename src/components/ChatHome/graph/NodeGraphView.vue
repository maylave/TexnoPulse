<!-- src/components/ChatHome/graph/NodeGraphView.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useNodeStore } from "@/stores/node";

const emit = defineEmits<{
  openChat: [chatId: string];
}>();

const nodeStore = useNodeStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);

interface SimNode {
  id: string;
  label: string;
  type: "folder" | "chat";
  parentId?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
}

let simNodes: SimNode[] = [];
let simLinks: SimLink[] = [];
let animFrameId = 0;

const camera = { x: 0, y: 0, zoom: 1 };
let isPanning = false;
let panStart = { x: 0, y: 0 };

let draggedNode: SimNode | null = null;
let hoveredNode: SimNode | null = null;

const syncGraphData = () => {
  const existingMap = new Map(simNodes.map((n) => [n.id, n]));
  const width = canvasRef.value?.width || 800;
  const height = canvasRef.value?.height || 600;

  simNodes = nodeStore.nodes.map((n, idx) => {
    const prev = existingMap.get(n.id);
    const angle = (idx / Math.max(1, nodeStore.nodes.length)) * Math.PI * 2;
    return {
      id: n.id,
      label: n.label,
      type: n.type,
      // Безопасно приводим null к undefined
      parentId: n.parentId ? String(n.parentId) : undefined,
      x: prev
        ? prev.x
        : width / 2 + Math.cos(angle) * 140 + (Math.random() - 0.5) * 40,
      y: prev
        ? prev.y
        : height / 2 + Math.sin(angle) * 140 + (Math.random() - 0.5) * 40,
      vx: prev ? prev.vx : 0,
      vy: prev ? prev.vy : 0,
      radius: n.type === "folder" ? 8 : 6,
    };
  });

  const nodeById = new Map(simNodes.map((n) => [n.id, n]));
  simLinks = [];

  for (const node of simNodes) {
    if (node.parentId) {
      const parent = nodeById.get(node.parentId);
      if (parent) {
        simLinks.push({ source: parent, target: node });
      }
    }
  }
};

const screenToWorld = (sx: number, sy: number) => ({
  x: (sx - camera.x) / camera.zoom,
  y: (sy - camera.y) / camera.zoom,
});

const findNodeAt = (wx: number, wy: number): SimNode | null => {
  for (let i = simNodes.length - 1; i >= 0; i--) {
    const n = simNodes[i];
    if (!n) continue;
    const dx = wx - n.x;
    const dy = wy - n.y;
    if (Math.hypot(dx, dy) <= n.radius + 8) {
      return n;
    }
  }
  return null;
};

const stepPhysics = (width: number, height: number) => {
  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < simNodes.length; i++) {
    for (let j = i + 1; j < simNodes.length; j++) {
      const a = simNodes[i];
      const b = simNodes[j];
      if (!a || !b) continue;

      const dx = b.x - a.x || 0.1;
      const dy = b.y - a.y || 0.1;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      const force = 2800 / Math.max(distSq, 120);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (a !== draggedNode) {
        a.vx -= fx;
        a.vy -= fy;
      }
      if (b !== draggedNode) {
        b.vx += fx;
        b.vy += fy;
      }
    }
  }

  const targetDistance = 130;
  for (const link of simLinks) {
    if (!link.source || !link.target) continue;

    const dx = link.target.x - link.source.x;
    const dy = link.target.y - link.source.y;
    const dist = Math.hypot(dx, dy) || 1;
    const delta = (dist - targetDistance) * 0.025;

    const fx = (dx / dist) * delta;
    const fy = (dy / dist) * delta;

    if (link.source !== draggedNode) {
      link.source.vx += fx;
      link.source.vy += fy;
    }
    if (link.target !== draggedNode) {
      link.target.vx -= fx;
      link.target.vy -= fy;
    }
  }

  for (const n of simNodes) {
    if (!n || n === draggedNode) continue;

    n.vx += (centerX - n.x) * 0.002;
    n.vy += (centerY - n.y) * 0.002;

    n.vx *= 0.85;
    n.vy *= 0.85;

    n.x += n.vx;
    n.y += n.vy;
  }
};

const render = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  stepPhysics(canvas.width, canvas.height);

  ctx.fillStyle = "#191919";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  for (const link of simLinks) {
    if (!link.source || !link.target) continue;
    const isHighlighted =
      hoveredNode &&
      (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id);

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = isHighlighted
      ? "rgba(56, 189, 248, 0.65)"
      : "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = isHighlighted ? 1.6 : 1;
    ctx.stroke();
  }

  for (const node of simNodes) {
    if (!node) continue;
    const isHovered = hoveredNode?.id === node.id;
    const isActive = nodeStore.activeChatId === node.id;

    ctx.beginPath();
    ctx.arc(
      node.x,
      node.y,
      isHovered ? node.radius + 2 : node.radius,
      0,
      Math.PI * 2,
    );

    if (isActive) {
      ctx.fillStyle = "#38bdf8";
    } else if (node.type === "folder") {
      ctx.fillStyle = isHovered ? "#ffffff" : "#b8b8b8";
    } else {
      ctx.fillStyle = isHovered ? "#e2e8f0" : "#8e8e8e";
    }

    ctx.fill();

    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle =
      isHovered || isActive ? "#ffffff" : "rgba(255, 255, 255, 0.78)";
    ctx.fillText(node.label, node.x, node.y + node.radius + 16);
  }

  ctx.restore();
  animFrameId = requestAnimationFrame(render);
};

const onMouseDown = (e: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  const hit = findNodeAt(x, y);

  if (hit) {
    draggedNode = hit;
  } else {
    isPanning = true;
    panStart = { x: e.clientX - camera.x, y: e.clientY - camera.y };
  }
};

const onMouseMove = (e: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

  if (draggedNode) {
    draggedNode.x = x;
    draggedNode.y = y;
    draggedNode.vx = 0;
    draggedNode.vy = 0;
    return;
  }

  if (isPanning) {
    camera.x = e.clientX - panStart.x;
    camera.y = e.clientY - panStart.y;
    return;
  }

  hoveredNode = findNodeAt(x, y);
};

const onMouseUp = () => {
  draggedNode = null;
  isPanning = false;
};

const onDoubleClick = (e: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const { x, y } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  const hit = findNodeAt(x, y);

  if (hit && hit.type === "chat") {
    nodeStore.selectChat(hit.id);
    emit("openChat", hit.id);
  }
};

const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  camera.zoom = Math.min(2.5, Math.max(0.35, camera.zoom * zoomFactor));
};

const resizeCanvas = () => {
  if (!canvasRef.value || !canvasRef.value.parentElement) return;
  canvasRef.value.width = canvasRef.value.parentElement.clientWidth;
  canvasRef.value.height = canvasRef.value.parentElement.clientHeight;
};

watch(() => nodeStore.nodes, syncGraphData, { deep: true });

onMounted(() => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  if (!nodeStore.nodes.length) {
    nodeStore.fetchNodes().then(syncGraphData);
  } else {
    syncGraphData();
  }
  animFrameId = requestAnimationFrame(render);
});

onUnmounted(() => {
  cancelAnimationFrame(animFrameId);
  window.removeEventListener("resize", resizeCanvas);
});
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-[#191919] select-none">
    <div
      class="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/50 pointer-events-none"
    >
      Перетаскивание: ЛКМ • Зум: Колесико • Двойной клик по узлу: Открыть чат
    </div>

    <canvas
      ref="canvasRef"
      class="w-full h-full cursor-grab active:cursor-grabbing"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @dblclick="onDoubleClick"
      @wheel="onWheel"
    />
  </div>
</template>
