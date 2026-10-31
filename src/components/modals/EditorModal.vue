<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRaw,
  watch,
} from "vue";
import {
  Check,
  ChevronDown,
  Send,
  SlidersHorizontal,
  SpellCheck,
  X as XIcon,
} from "lucide-vue-next";
import { useSpellcheck } from "@/composables/useSpellcheck";
import { useAppStore } from "@/stores/appLayout";
import { useMessagesStore } from "@/stores/messages";
import BlockRenderer from "@/components/editor/BlockRenderer.vue";
import EditorContextMenu from "@/components/editor/EditorContextMenu.vue";
import EditorToolbar from "@/components/editor/toolbar/EditorToolbar.vue";
import {
  createCanvas,
  createChecklist,
  createCode,
  createDivider,
  createFromFile,
  createTable,
  createText,
  releaseBlock,
  uid,
} from "../editor/editor.blocks.ts";
import type {
  BlockHighlight,
  EditorBlock,
  EditorTheme,
  TextAlign,
  TextVariant,
} from "@/types/editor.types";
import type { EditorAction } from "@/types/toolbar.types";

const props = defineProps<{ isOpen?: boolean }>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", content: EditorBlock[]): void;
}>();

const {
  isChecking,
  issues,
  lastReport,
  checkBlocks,
  applySuggestion,
  autoFixAllBlocks,
} = useSpellcheck();

const messagesStore = useMessagesStore();
const appStore = useAppStore();

const initialBlock = createText();
const blocks = ref<EditorBlock[]>([initialBlock]);
const focusedId = ref<string | null>(initialBlock.id);
const fileInput = ref<HTMLInputElement | null>(null);
const sheetRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);

const isToolbarCollapsed = ref(false);
const currentTheme = ref<EditorTheme>("aether");

const contextMenu = ref({
  isOpen: false,
  x: 0,
  y: 0,
});

const FILE_ACCEPT: Partial<Record<EditorAction, string>> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  file: "",
};

const modalOpen = computed(
  () =>
    props.isOpen ?? (appStore.isModalEditorOpen || messagesStore.isEditorOpen),
);

const currentBlock = computed(() =>
  blocks.value.find((b) => b.id === focusedId.value),
);

const canSend = computed(() =>
  blocks.value.some((b) => {
    if (b.type === "text") return b.text.trim().length > 0;
    if (b.type === "code") return b.code.trim().length > 0;
    if (b.type === "checklist")
      return b.items.some((i) => i.text.trim().length > 0);
    if (b.type === "table")
      return b.rows.some((r) => r.some((c) => c.trim().length > 0));
    if (b.type === "canvas") return b.nodes.length > 0 || b.strokes.length > 0;
    return true;
  }),
);

const closeModal = () => {
  appStore.isModalEditorOpen = false;
  messagesStore.closeEditor();
  emit("close");
};

const focusBlockById = async (id: string) => {
  focusedId.value = id;
  await nextTick();
  const el = sheetRef.value?.querySelector<HTMLElement>(
    `[data-block-id="${id}"] [data-block-focus]`,
  );
  el?.focus();
};

watch(modalOpen, async (open) => {
  if (open) {
    if (messagesStore.draftText.trim()) {
      blocks.value = [createText(messagesStore.draftText)];
      messagesStore.draftText = "";
    } else if (!blocks.value.length) {
      blocks.value = [createText()];
    }
    const firstBlock = blocks.value[0];
    if (firstBlock) {
      await focusBlockById(firstBlock.id);
    }
  }
});

const insertBlocksAfter = (afterId: string | null, ...items: EditorBlock[]) => {
  if (!items.length) return;
  const i = blocks.value.findIndex((b) => b.id === afterId);
  const at = i === -1 ? blocks.value.length : i + 1;
  blocks.value.splice(at, 0, ...items);

  const lastInserted = items[items.length - 1];
  if (lastInserted) {
    focusBlockById(lastInserted.id);
  }
};

const insertBlocks = (...items: EditorBlock[]) => {
  insertBlocksAfter(focusedId.value, ...items);
};

const removeBlock = (id: string) => {
  const index = blocks.value.findIndex((b) => b.id === id);
  const block = blocks.value[index];
  if (block) releaseBlock(block);

  blocks.value = blocks.value.filter((b) => b.id !== id);
  if (!blocks.value.length) {
    const fresh = createText();
    blocks.value.push(fresh);
    focusBlockById(fresh.id);
  } else {
    const prev = blocks.value[Math.max(0, index - 1)];
    if (prev) focusBlockById(prev.id);
  }
};

const duplicateFocusedBlock = () => {
  const b = currentBlock.value;
  if (!b) return;
  const raw = structuredClone(toRaw(b));
  raw.id = uid();
  insertBlocksAfter(b.id, raw);
};

const focusedText = () => {
  const b = currentBlock.value;
  return b?.type === "text" ? b : null;
};

const wrapTextBasic = (prefix: string, suffix = prefix) => {
  const b = focusedText();
  if (!b) return;
  b.text = `${b.text}${prefix}текст${suffix}`;
};

const addFiles = (files: File[]) => {
  if (files.length) insertBlocks(...files.map((f) => createFromFile(f)));
};

const openPicker = (accept: string) => {
  const el = fileInput.value;
  if (!el) return;
  el.accept = accept;
  el.value = "";
  el.click();
};

const onPicked = (e: Event) => {
  addFiles(Array.from((e.target as HTMLInputElement).files ?? []));
};

const onDragOver = (e: DragEvent) => {
  if (e.dataTransfer?.types.includes("Files")) isDragging.value = true;
};

const onDragLeave = (e: DragEvent) => {
  const host = e.currentTarget as HTMLElement;
  if (!host.contains(e.relatedTarget as Node)) isDragging.value = false;
};

const onDrop = (e: DragEvent) => {
  isDragging.value = false;
  addFiles(Array.from(e.dataTransfer?.files ?? []));
};

const onPaste = (e: ClipboardEvent) => {
  const files = Array.from(e.clipboardData?.files ?? []);
  if (!files.length) return;
  e.preventDefault();
  addFiles(files);
};

const openContextMenu = (e: MouseEvent, blockId?: string) => {
  if (blockId) focusedId.value = blockId;
  contextMenu.value = {
    isOpen: true,
    x: e.clientX,
    y: e.clientY,
  };
};

const handleFormat = (action: EditorAction, value?: unknown) => {
  const accept = FILE_ACCEPT[action];
  if (accept !== undefined) return openPicker(accept);

  switch (action) {
    case "text_block":
      return insertBlocks(createText());
    case "code_block":
      return insertBlocks(createCode());
    case "todo":
      return insertBlocks(createChecklist());
    case "table":
      return insertBlocks(createTable());
    case "divider":
      return insertBlocks(createDivider());
    case "canvas":
      return insertBlocks(createCanvas());
    case "variant": {
      const b = focusedText();
      if (b) b.variant = value as TextVariant;
      else
        insertBlocks(
          Object.assign(createText(), { variant: value as TextVariant }),
        );
      return;
    }
    case "align": {
      const b = focusedText();
      if (b) b.align = value as TextAlign;
      return;
    }
    case "highlight": {
      if (currentBlock.value) {
        currentBlock.value.highlight = value as BlockHighlight;
      }
      return;
    }
    case "theme": {
      currentTheme.value = value as EditorTheme;
      return;
    }
    case "bold":
      return wrapTextBasic("**");
    case "italic":
      return wrapTextBasic("*");
    case "underline":
      return wrapTextBasic("__");
    case "strike":
      return wrapTextBasic("~~");
    case "code":
      return wrapTextBasic("`");
    case "list":
      return insertBlocks(createText("• "));
    case "ordered_list":
      return insertBlocks(createText("1. "));
    case "duplicate_block":
      return duplicateFocusedBlock();
    case "delete_block":
      if (focusedId.value) removeBlock(focusedId.value);
      return;
    case "spellcheck":
      checkBlocks(blocks.value);
      return;
    case "ai_fix":
      autoFixAllBlocks(blocks.value);
      return;
  }
};

const handleSendToChat = () => {
  if (!canSend.value) return;
  const rawBlocks = toRaw(blocks.value);
  messagesStore.sendFromEditor(rawBlocks);
  emit("save", rawBlocks);

  const fresh = createText();
  blocks.value = [fresh];
  focusedId.value = fresh.id;
  closeModal();
};

const onGlobalKeydown = (e: KeyboardEvent) => {
  if (!modalOpen.value) return;
  if ((e.ctrlKey || e.metaKey) && e.code === "Backslash") {
    e.preventDefault();
    isToolbarCollapsed.value = !isToolbarCollapsed.value;
  } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    handleSendToChat();
  }
};

onMounted(() => window.addEventListener("keydown", onGlobalKeydown));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]"
    leave-active-class="transition duration-200 ease-in"
    enter-from-class="opacity-0 scale-98 translate-y-2"
    leave-to-class="opacity-0 scale-98 translate-y-2"
  >
    <div
    
      :data-editor-theme="currentTheme"
      class="fixed inset-0 z-50 flex items-center justify-center bg-(--editor-overlay-bg) p-4 backdrop-blur-(--editor-overlay-blur) md:p-10"
      @click.self="closeModal"
    >
      <!-- 🌟 Динамическая высота: растет вместе с контентом от min-h-[220px] до max-h-[85vh] -->
      <div
        class="relative flex h-auto min-h-[220px] max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-(--editor-sheet-radius) border border-(--editor-border) bg-(--editor-sheet-bg) shadow-2xl transition-all duration-300"
      >
        <!-- Сворачиваемая шапка с инструментами -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 -translate-y-4 max-h-0"
          leave-to-class="opacity-0 -translate-y-4 max-h-0"
        >
          <EditorToolbar
            v-if="!isToolbarCollapsed"
            :current-theme="currentTheme"
            :current-highlight="currentBlock?.highlight"
            @format="handleFormat"
            @collapse="isToolbarCollapsed = true"
          />
        </Transition>

        <!-- Плавающие кнопки управления, когда шапка скрыта -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          leave-active-class="transition duration-150 ease-in"
          enter-from-class="opacity-0 -translate-y-2"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="isToolbarCollapsed"
            class="absolute top-3 right-4 z-30 flex items-center gap-1.5"
          >
            <button
              type="button"
              title="Показать панель инструментов (Ctrl+\)"
              class="flex items-center gap-1.5 rounded-full border border-(--editor-border) bg-(--toolbar-bg) px-3 py-1.5 text-xs font-medium text-on-surface-variant shadow-lg backdrop-blur-xl transition-all hover:border-accent/40 hover:text-on-surface"
              @click="isToolbarCollapsed = false"
            >
              <SlidersHorizontal class="size-3.5 text-accent" />
              <span>Инструменты</span>
              <ChevronDown class="size-3.5 opacity-70" />
            </button>

            <button
              type="button"
              title="Закрыть (Esc)"
              class="flex size-7 items-center justify-center rounded-full border border-(--editor-border) bg-(--toolbar-bg) text-on-surface-variant hover:text-on-surface"
              @click="closeModal"
            >
              <XIcon class="size-3.5" />
            </button>
          </div>
        </Transition>

        <!-- Рабочая область (динамически растягивается и скроллится при достижении max-h) -->
        <div
          class="relative flex min-h-[160px] flex-1 flex-col overflow-hidden"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
          @paste="onPaste"
          @contextmenu.prevent="openContextMenu($event)"
        >
          <!-- 🌟 Всплывающая панель найденных орфографических ошибок и отчетов -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            leave-active-class="transition duration-150 ease-in"
            enter-from-class="opacity-0 -translate-y-2"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-if="issues.length > 0 || lastReport || isChecking"
              class="mx-8 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-(--editor-border) bg-black/30 px-4 py-2 text-xs backdrop-blur-md"
            >
              <SpellCheck class="size-4 text-accent shrink-0" />

              <span
                v-if="isChecking"
                class="text-on-surface-variant animate-pulse"
              >
                Проверяем орфографию и пунктуацию…
              </span>

              <span
                v-else-if="lastReport"
                class="text-emerald-400 font-medium flex items-center gap-1"
              >
                <Check class="size-3.5" /> {{ lastReport }}
              </span>

              <template v-else>
                <span class="text-on-surface-variant mr-1">
                  Найдены опечатки ({{ issues.length }}):
                </span>

                <div
                  v-for="issue in issues"
                  :key="issue.id"
                  class="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1"
                >
                  <span class="line-through text-rose-300">{{
                    issue.word
                  }}</span>
                  <span class="text-on-surface-variant/50">→</span>
                  <button
                    v-for="sug in issue.suggestions.slice(0, 3)"
                    :key="sug"
                    type="button"
                    class="rounded bg-accent/20 px-1.5 py-0.5 font-medium text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
                    @click="applySuggestion(blocks, issue, sug)"
                  >
                    {{ sug }}
                  </button>
                </div>

                <button
                  type="button"
                  class="ml-auto rounded-lg bg-accent px-2.5 py-1 font-medium text-white hover:brightness-110 transition-all cursor-pointer"
                  @click="autoFixAllBlocks(blocks)"
                >
                  Исправить всё
                </button>
              </template>
            </div>
          </Transition>

          <div
            class="editor-scroll flex-1 overflow-y-auto px-8 pt-7 pb-16 md:px-14"
          >
            <div
              ref="sheetRef"
              class="mx-auto flex max-w-(--editor-sheet-max-width) flex-col gap-1.5"
            >
              <BlockRenderer
                v-for="(block, i) in blocks"
                :key="block.id"
                :model-value="block"
                @update:model-value="blocks[i] = $event"
                @focus="focusedId = block.id"
                @remove="removeBlock(block.id)"
                @insert-after="insertBlocksAfter(block.id, createText())"
                @open-menu="openContextMenu($event, block.id)"
              />
            </div>
          </div>

          <!-- 🌟 Плавающая круглая кнопка ОТПРАВИТЬ в правом нижнем углу -->
          <button
            type="button"
            title="Отправить в чат (Ctrl+Enter)"
            :disabled="!canSend"
            class="editor-send-btn absolute right-5 bottom-4 z-30 flex size-11 items-center justify-center rounded-full transition-all duration-300"
            :class="
              canSend
                ? 'editor-send-active hover:scale-110 active:scale-95 cursor-pointer'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            "
            @click="handleSendToChat"
          >
            <Send
              class="size-4 transform transition-transform duration-200"
              :class="{ 'translate-x-[1px] rotate-12': canSend }"
            />
          </button>

          <!-- Оверлей Drag & Drop -->
          <Transition
            enter-active-class="transition-opacity duration-150"
            leave-active-class="transition-opacity duration-150"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div
              v-if="isDragging"
              class="pointer-events-none absolute inset-3 grid place-items-center rounded-(--editor-sheet-radius) border-2 border-dashed border-accent/40 bg-accent/5 text-(length:--font-size-body-md) text-on-surface-variant"
            >
              Отпустите, чтобы вставить файлы
            </div>
          </Transition>
        </div>

        <!-- Контекстное меню по правой кнопке мыши -->
        <EditorContextMenu
          :is-open="contextMenu.isOpen"
          :x="contextMenu.x"
          :y="contextMenu.y"
          :current-highlight="currentBlock?.highlight"
          @close="contextMenu.isOpen = false"
          @format="handleFormat"
        />

        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="onPicked"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.editor-send-active {
  background: var(--input-send-bg, var(--color-accent, #38bdf8));
  color: var(--input-send-text, #fff);
  box-shadow: 0 0 18px var(--input-send-glow, var(--color-accent, #38bdf8));
}
.editor-send-active:hover {
  background: var(--input-send-bg-hover, #7dd3fc);
}
</style>
