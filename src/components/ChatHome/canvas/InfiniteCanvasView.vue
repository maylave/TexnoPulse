<!-- src/components/ChatHome/canvas/InfiniteCanvasView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import {
  MessageSquare,
  Folder,
  Trash2,
  Layers,
  GitCommit,
  Magnet,
  Unplug,
  SplitSquareVertical,
  Type,
  Code2,
  Palette,
  ListChecks,
} from "lucide-vue-next";
import { useNodeStore } from "@/stores/node";
import { useMessagesStore } from "@/stores/messages";
import { blockConfig } from "@/config/messageBlocks";
import type { AnyMessageContent } from "@/types/message";

const emit = defineEmits<{
  openChat: [chatId: string];
}>();

const nodeStore = useNodeStore();
const messagesStore = useMessagesStore();

const containerRef = ref<HTMLElement | null>(null);
const cardRefs = new Map<string, HTMLElement>();

const setCardRef = (id: string, el: unknown) => {
  if (el && el instanceof HTMLElement) {
    cardRefs.set(id, el);
  } else {
    cardRefs.delete(id);
  }
};

const canvasScope = ref<"chats" | "messages">("messages");

const camera = ref({ x: 120, y: 90, zoom: 0.95 });
const isPanning = ref(false);
const panStart = { x: 0, y: 0 };

interface MagCanvasCard {
  id: string;
  sourceMessageId?: string;
  title: string;
  type: "folder" | "chat" | "message";
  content?: string;
  blocks: AnyMessageContent[];
  x: number;
  y: number;
  snapTo: string | null;
}

const canvasCards = ref<MagCanvasCard[]>([]);

const draggedCardId = ref<string | null>(null);
const dragOffset = { x: 0, y: 0 };
const isAltPressed = ref(false);

const snapPreviewTargetId = ref<string | null>(null);
const mergePreviewTargetId = ref<string | null>(null);

const SNAP_GAP = 8;
const SNAP_THRESHOLD = 45;

const activeChatName = computed(() => {
  const found = nodeStore.nodes.find((n) => n.id === nodeStore.activeChatId);
  return found ? found.label : "Общий чат";
});

const getCardHeight = (id: string): number => {
  const el = cardRefs.get(id);
  return el ? el.offsetHeight : 140;
};

const getSnappedChainIds = (rootId: string): string[] => {
  const result: string[] = [];
  const queue = [rootId];
  const visited = new Set<string>([rootId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    for (const card of canvasCards.value) {
      if (card.snapTo === current && !visited.has(card.id)) {
        visited.add(card.id);
        result.push(card.id);
        queue.push(card.id);
      }
    }
  }
  return result;
};

const loadScopeData = async () => {
  canvasCards.value = [];

  if (canvasScope.value === "chats") {
    nodeStore.nodes.forEach((node, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      canvasCards.value.push({
        id: node.id,
        title: node.label,
        type: node.type,
        content:
          node.type === "folder"
            ? `Папка • Внутри элементов: ${nodeStore.getChildren(node.id).length}`
            : "Двойной клик — открыть блоки чата",
        blocks: [],
        x: col * 360 + 60,
        y: row * 220 + 60,
        snapTo: null,
      });
    });
  } else {
    await messagesStore.loadMessages(nodeStore.activeChatId);
    const msgs = messagesStore.messages.filter(
      (m) => m.chatId === nodeStore.activeChatId,
    );

    msgs.forEach((msg, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const senderLabel = msg.isOwn
        ? "Вы"
        : msg.sender
          ? msg.sender
          : "Собеседник";
      canvasCards.value.push({
        id: msg.id,
        sourceMessageId: msg.id,
        title: `${senderLabel} • Блок #${idx + 1}`,
        type: "message",
        blocks: JSON.parse(JSON.stringify(msg.content)),
        x: col * 360 + 60,
        y: row * 320 + 60,
        snapTo: null,
      });
    });
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Alt") isAltPressed.value = true;
};
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === "Alt") isAltPressed.value = false;
};

onMounted(async () => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  if (!nodeStore.nodes.length) {
    await nodeStore.fetchNodes();
  }
  await loadScopeData();
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});

watch(canvasScope, loadScopeData);
watch(
  () => nodeStore.activeChatId,
  () => {
    if (canvasScope.value === "messages") loadScopeData();
  },
);

const getBlockComponent = (type: AnyMessageContent["type"]) => {
  const cfg = blockConfig[type];
  return cfg && cfg.component ? cfg.component : blockConfig.text.component;
};

const getBlockTypeLabel = (b: AnyMessageContent): string => {
  switch (b.type) {
    case "text":
      return "Текст";
    case "code":
      return `Код (${b.language ? b.language : "txt"})`;
    case "file":
      return b.name ? b.name : "Файл";
    case "image":
      return "Изображение";
    case "color":
      return `Цвет ${b.value}`;
    case "checklist":
      return b.title ? b.title : "Чек-лист";
    default:
      return b.type;
  }
};

const syncCardToStore = (card: MagCanvasCard) => {
  const targetId = card.sourceMessageId ? card.sourceMessageId : card.id;
  const msgInStore = messagesStore.messages.find((m) => m.id === targetId);
  if (msgInStore) {
    msgInStore.content = JSON.parse(JSON.stringify(card.blocks));
    messagesStore.editMessage(msgInStore.id, card.blocks).catch(() => {});
  }
};

const realignSnappedChain = (rootId: string) => {
  const root = canvasCards.value.find((c) => c.id === rootId);
  if (!root) return;

  const chainIds = getSnappedChainIds(rootId);
  let prevCard = root;

  for (const childId of chainIds) {
    const child = canvasCards.value.find((c) => c.id === childId);
    if (!child) continue;
    const prevHeight = getCardHeight(prevCard.id);
    child.x = prevCard.x;
    child.y = prevCard.y + prevHeight + SNAP_GAP;
    prevCard = child;
  }
};

const startCardDrag = (e: MouseEvent, id: string, forceUnlink = false) => {
  e.stopPropagation();
  draggedCardId.value = id;

  const card = canvasCards.value.find((b) => b.id === id);
  if (!card) return;

  if (e.altKey || isAltPressed.value || forceUnlink) {
    card.snapTo = null;
  }

  dragOffset.x = e.clientX - (card.x * camera.value.zoom + camera.value.x);
  dragOffset.y = e.clientY - (card.y * camera.value.zoom + camera.value.y);
};

const detachMiniBlock = (
  e: MouseEvent,
  parentCard: MagCanvasCard,
  blockIndex: number,
  startDraggingImmediately = true,
) => {
  e.stopPropagation();

  if (parentCard.blocks.length <= 1) {
    parentCard.snapTo = null;
    if (startDraggingImmediately) {
      startCardDrag(e, parentCard.id, true);
    }
    return;
  }

  const extractedBlock = parentCard.blocks.splice(blockIndex, 1)[0];
  if (!extractedBlock) return;

  syncCardToStore(parentCard);

  const newCardId = `mini-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newCard: MagCanvasCard = {
    id: newCardId,
    title: getBlockTypeLabel(extractedBlock),
    type: "message",
    blocks: [extractedBlock],
    x: parentCard.x + 35,
    y: parentCard.y + 45 + blockIndex * 70,
    snapTo: null,
  };

  canvasCards.value.push(newCard);

  if (startDraggingImmediately) {
    nextTick(() => {
      startCardDrag(e, newCard.id, true);
    });
  }
};

const onMiniBlockMouseDown = (
  e: MouseEvent,
  card: MagCanvasCard,
  bIdx: number,
) => {
  if (e.altKey || isAltPressed.value) {
    detachMiniBlock(e, card, bIdx, true);
  }
};

const onTextareaMouseDown = (
  e: MouseEvent,
  card: MagCanvasCard,
  bIdx: number,
) => {
  e.stopPropagation();
  if (e.altKey || isAltPressed.value) {
    detachMiniBlock(e, card, bIdx, true);
  }
};

const explodeCardIntoMiniBlocks = async (card: MagCanvasCard) => {
  if (card.blocks.length <= 1) return;

  const originalBlocks = [...card.blocks];
  const firstBlock = originalBlocks[0];
  if (!firstBlock) return;

  card.blocks = [firstBlock];
  card.title = getBlockTypeLabel(firstBlock);
  syncCardToStore(card);

  let prevId = card.id;
  let currentY = card.y + 150;

  for (let i = 1; i < originalBlocks.length; i++) {
    const b = originalBlocks[i];
    if (!b) continue;
    const miniId = `mini-${Date.now()}-${i}`;
    const miniCard: MagCanvasCard = {
      id: miniId,
      title: getBlockTypeLabel(b),
      type: "message",
      blocks: [b],
      x: card.x,
      y: currentY,
      snapTo: prevId,
    };
    canvasCards.value.push(miniCard);
    prevId = miniId;
    currentY += 135;
  }

  await nextTick();
  realignSnappedChain(card.id);
};

const addMiniBlockToCard = (
  card: MagCanvasCard,
  type: "text" | "code" | "color" | "checklist",
) => {
  if (type === "text") {
    card.blocks.push({ type: "text", text: "Новая заметка" });
  } else if (type === "code") {
    card.blocks.push({
      type: "code",
      language: "ts",
      fileName: "snippet.ts",
      code: "console.log('Hello');",
    });
  } else if (type === "color") {
    card.blocks.push({ type: "color", value: "#38bdf8", label: "Цвет" });
  } else if (type === "checklist") {
    card.blocks.push({
      type: "checklist",
      title: "Задачи",
      items: [{ id: `chk-${Date.now()}`, text: "Пункт 1", isChecked: false }],
    });
  }

  syncCardToStore(card);
  nextTick(() => realignSnappedChain(card.id));
};

const removeMiniBlock = (card: MagCanvasCard, bIdx: number) => {
  card.blocks.splice(bIdx, 1);
  if (card.blocks.length === 0) {
    deleteCard(card);
  } else {
    syncCardToStore(card);
    nextTick(() => realignSnappedChain(card.id));
  }
};

const deleteCard = (card: MagCanvasCard) => {
  canvasCards.value.forEach((c) => {
    if (c.snapTo === card.id) c.snapTo = null;
  });
  canvasCards.value = canvasCards.value.filter((c) => c.id !== card.id);
  if (card.sourceMessageId) {
    messagesStore.deleteMessage(card.sourceMessageId);
  }
};

const onCardDblClick = (card: MagCanvasCard) => {
  if (card.type === "chat") {
    nodeStore.activeChatId = card.id;
    canvasScope.value = "messages";
  }
};

const onMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    camera.value.x = e.clientX - panStart.x;
    camera.value.y = e.clientY - panStart.y;
    return;
  }

  if (draggedCardId.value === null) return;

  const card = canvasCards.value.find((b) => b.id === draggedCardId.value);
  if (!card) return;

  const oldX = card.x;
  const oldY = card.y;

  card.x = (e.clientX - dragOffset.x - camera.value.x) / camera.value.zoom;
  card.y = (e.clientY - dragOffset.y - camera.value.y) / camera.value.zoom;

  const dx = card.x - oldX;
  const dy = card.y - oldY;

  const chainIds = new Set(getSnappedChainIds(card.id));
  canvasCards.value.forEach((b) => {
    if (chainIds.has(b.id)) {
      b.x += dx;
      b.y += dy;
    }
  });

  snapPreviewTargetId.value = null;
  mergePreviewTargetId.value = null;

  if (!e.altKey && !isAltPressed.value && card.snapTo === null) {
    for (const target of canvasCards.value) {
      if (target.id === card.id || chainIds.has(target.id)) continue;

      const targetHeight = getCardHeight(target.id);

      const snapPointX = target.x;
      const snapPointY = target.y + targetHeight + SNAP_GAP;
      const snapDist = Math.hypot(card.x - snapPointX, card.y - snapPointY);

      if (snapDist < SNAP_THRESHOLD) {
        card.x = snapPointX;
        card.y = snapPointY;
        card.snapTo = target.id;
        snapPreviewTargetId.value = target.id;
        realignSnappedChain(card.id);
        break;
      }

      const centerDistX = Math.abs(card.x - target.x);
      const isInsideY =
        card.y > target.y + 15 && card.y < target.y + targetHeight - 25;

      if (canvasScope.value === "messages" && centerDistX < 70 && isInsideY) {
        mergePreviewTargetId.value = target.id;
        break;
      }
    }
  }
};

const onMouseUp = () => {
  if (draggedCardId.value && mergePreviewTargetId.value) {
    const source = canvasCards.value.find((c) => c.id === draggedCardId.value);
    const target = canvasCards.value.find(
      (c) => c.id === mergePreviewTargetId.value,
    );

    if (source && target && source.id !== target.id) {
      target.blocks.push(...source.blocks);
      syncCardToStore(target);

      canvasCards.value.forEach((c) => {
        if (c.snapTo === source.id) c.snapTo = target.id;
      });
      canvasCards.value = canvasCards.value.filter((c) => c.id !== source.id);
      nextTick(() => realignSnappedChain(target.id));
    }
  }

  isPanning.value = false;
  draggedCardId.value = null;
  snapPreviewTargetId.value = null;
  mergePreviewTargetId.value = null;
};

const onCanvasMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;
  isPanning.value = true;
  panStart.x = e.clientX - camera.value.x;
  panStart.y = e.clientY - camera.value.y;
};

const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.08 : 0.92;
  const newZoom = Math.min(2.2, Math.max(0.25, camera.value.zoom * factor));

  const rect = containerRef.value?.getBoundingClientRect();
  const mx = e.clientX - (rect ? rect.left : 0);
  const my = e.clientY - (rect ? rect.top : 0);

  camera.value.x = mx - (mx - camera.value.x) * (newZoom / camera.value.zoom);
  camera.value.y = my - (my - camera.value.y) * (newZoom / camera.value.zoom);
  camera.value.zoom = newZoom;
};

const createStandaloneBlockOnCanvas = (
  type: "text" | "code" | "color" | "checklist",
) => {
  let block: AnyMessageContent;
  if (type === "text") {
    block = { type: "text", text: "Новый текстовый блок" };
  } else if (type === "code") {
    block = {
      type: "code",
      language: "ts",
      fileName: "index.ts",
      code: "export const app = true;",
    };
  } else if (type === "color") {
    block = { type: "color", value: "#38bdf8", label: "Sky" };
  } else {
    block = {
      type: "checklist",
      title: "Список задач",
      items: [{ id: `i-${Date.now()}`, text: "Задача 1", isChecked: false }],
    };
  }

  const centerWorldX =
    (-camera.value.x + window.innerWidth / 2 - 160) / camera.value.zoom;
  const centerWorldY =
    (-camera.value.y + window.innerHeight / 2 - 100) / camera.value.zoom;

  canvasCards.value.push({
    id: `standalone-${Date.now()}`,
    title: getBlockTypeLabel(block),
    type: "message",
    blocks: [block],
    x: centerWorldX + (Math.random() - 0.5) * 40,
    y: centerWorldY + (Math.random() - 0.5) * 40,
    snapTo: null,
  });
};
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full overflow-hidden bg-[#121216] select-none cursor-grab active:cursor-grabbing"
    @mousedown="onCanvasMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
    @wheel="onWheel"
  >
    <div
      class="absolute inset-0 pointer-events-none opacity-25"
      :style="{
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)',
        backgroundSize: `${28 * camera.zoom}px ${28 * camera.zoom}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
      }"
    />

    <!-- Верхняя панель управления -->
    <div
      class="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#1b1b22]/90 backdrop-blur-xl border border-white/10 shadow-xl"
      @mousedown.stop
    >
      <div
        class="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/5 text-xs"
      >
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition"
          :class="
            canvasScope === 'chats'
              ? 'bg-sky-500/20 text-sky-300 font-medium border border-sky-400/30'
              : 'text-white/50 hover:text-white'
          "
          @click="canvasScope = 'chats'"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Чаты и папки</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition"
          :class="
            canvasScope === 'messages'
              ? 'bg-sky-500/20 text-sky-300 font-medium border border-sky-400/30'
              : 'text-white/50 hover:text-white'
          "
          @click="canvasScope = 'messages'"
        >
          <GitCommit class="w-3.5 h-3.5" />
          <span>{{ activeChatName }}</span>
        </button>
      </div>

      <div
        v-if="canvasScope === 'messages'"
        class="flex items-center gap-1 bg-white/[0.03] px-1.5 py-1 rounded-xl border border-white/5"
      >
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/70 hover:text-sky-300 hover:bg-white/10 transition"
          @click="createStandaloneBlockOnCanvas('text')"
        >
          <Type class="w-3.5 h-3.5" />
          <span>Текст</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/70 hover:text-emerald-300 hover:bg-white/10 transition"
          @click="createStandaloneBlockOnCanvas('code')"
        >
          <Code2 class="w-3.5 h-3.5" />
          <span>Код</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/70 hover:text-pink-300 hover:bg-white/10 transition"
          @click="createStandaloneBlockOnCanvas('color')"
        >
          <Palette class="w-3.5 h-3.5" />
          <span>Цвет</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/70 hover:text-amber-300 hover:bg-white/10 transition"
          @click="createStandaloneBlockOnCanvas('checklist')"
        >
          <ListChecks class="w-3.5 h-3.5" />
          <span>Задачи</span>
        </button>
      </div>
    </div>

    <!-- Подсказка внизу -->
    <div
      class="absolute bottom-4 left-4 z-20 px-3.5 py-2 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-[11px] text-white/60 pointer-events-none flex items-center gap-3"
    >
      <span
        ><b>Alt + ЛКМ по мини-блоку</b> — выдернуть файл/цвет/текст
        отдельно</span
      >
      <span>•</span>
      <span>Поднесите к низу карточки — <b>примагнитить</b></span>
      <span>•</span>
      <span>Наведите в центр — <b>объединить</b></span>
    </div>

    <!-- Мир холста -->
    <div
      class="absolute top-0 left-0 origin-top-left"
      :style="{
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
      }"
    >
      <div
        v-for="card in canvasCards"
        :key="card.id"
        :ref="(el) => setCardRef(card.id, el)"
        class="absolute w-[320px] rounded-2xl bg-[#1a1b22]/95 backdrop-blur-md border transition-shadow duration-150 flex flex-col shadow-2xl"
        :class="[
          mergePreviewTargetId === card.id
            ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
            : card.snapTo !== null
              ? 'border-sky-400/80 shadow-[0_0_18px_rgba(56,189,248,0.18)]'
              : 'border-white/15 hover:border-white/30',
        ]"
        :style="{ left: `${card.x}px`, top: `${card.y}px` }"
        @mousedown="startCardDrag($event, card.id)"
        @dblclick.stop="onCardDblClick(card)"
      >
        <div
          v-if="card.snapTo !== null"
          class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]"
        />

        <!-- Шапка карточки -->
        <div
          class="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-white/[0.02] rounded-t-2xl cursor-move"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Folder
              v-if="card.type === 'folder'"
              class="w-3.5 h-3.5 text-amber-400 shrink-0"
            />
            <Magnet
              v-else-if="card.snapTo !== null"
              class="w-3.5 h-3.5 text-sky-400 shrink-0"
            />
            <MessageSquare v-else class="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span class="text-[11px] font-semibold text-white/90 truncate">
              {{ card.title }}
            </span>
          </div>

          <div
            v-if="card.type === 'message'"
            class="flex items-center gap-0.5"
            @mousedown.stop
          >
            <button
              type="button"
              title="Добавить текст внутрь"
              class="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
              @click="addMiniBlockToCard(card, 'text')"
            >
              <Type class="w-3 h-3" />
            </button>
            <button
              type="button"
              title="Добавить код внутрь"
              class="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
              @click="addMiniBlockToCard(card, 'code')"
            >
              <Code2 class="w-3 h-3" />
            </button>

            <button
              v-if="card.blocks.length > 1"
              type="button"
              title="Разделить все вложения по отдельности"
              class="p-1 rounded-lg text-sky-400/70 hover:text-sky-300 hover:bg-sky-500/15 transition"
              @click="explodeCardIntoMiniBlocks(card)"
            >
              <SplitSquareVertical class="w-3.5 h-3.5" />
            </button>

            <button
              v-if="card.snapTo !== null"
              type="button"
              title="Отсоединить магнит"
              class="p-1 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/15 transition"
              @click="card.snapTo = null"
            >
              <Unplug class="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Удалить блок"
              class="p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/10 transition"
              @click="deleteCard(card)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Тело карточки: список мини-блоков -->
        <div class="p-2.5 space-y-2 text-xs text-white/90">
          <div v-if="card.content" class="text-white/50 px-1 py-1">
            {{ card.content }}
          </div>

          <div
            v-for="(b, bIdx) in card.blocks"
            :key="bIdx"
            class="group/mini relative rounded-xl bg-black/35 border border-white/10 hover:border-sky-400/40 p-2 transition-all"
            @mousedown="onMiniBlockMouseDown($event, card, bIdx)"
          >
            <div
              v-if="card.blocks.length > 1"
              class="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-0 group-hover/mini:opacity-100 transition-opacity bg-[#15161c]/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/15"
              @mousedown.stop
            >
              <button
                type="button"
                class="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 px-1 py-0.5"
                @mousedown="detachMiniBlock($event, card, bIdx, true)"
              >
                <Unplug class="w-3 h-3" />
                <span>Отделить</span>
              </button>

              <button
                type="button"
                class="text-white/40 hover:text-rose-400 px-0.5"
                @click="removeMiniBlock(card, bIdx)"
              >
                ✕
              </button>
            </div>

            <textarea
              v-if="b.type === 'text'"
              v-model="b.text"
              rows="2"
              class="w-full bg-transparent text-xs text-white focus:outline-none resize-none"
              @mousedown="onTextareaMouseDown($event, card, bIdx)"
              @change="syncCardToStore(card)"
            />

            <component :is="getBlockComponent(b.type)" v-else :block="b" />
          </div>
        </div>

        <!-- Нижняя магнитная грань -->
        <div class="h-1.5 w-full flex justify-center items-center pb-1">
          <div
            class="w-12 h-1 rounded-full transition-colors"
            :class="
              snapPreviewTargetId === card.id
                ? 'bg-sky-400 shadow-[0_0_12px_#38bdf8]'
                : 'bg-white/15'
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>
