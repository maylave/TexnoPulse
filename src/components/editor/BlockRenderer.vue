<!-- src/components/editor/BlockRenderer.vue -->
<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  Copy,
  Download,
  FileText,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-vue-next";
import UiButton from "@/components/ui/UiButton.vue";
import UiDropdown from "@/components/ui/UiDropdown.vue";
import UiIconButton from "@/components/ui/UiIconButton.vue";
import {
  CODE_LANGUAGES,
  createChecklistItem,
  formatBytes,
} from "./editor.blocks";
import type {
  BlockHighlight,
  EditorBlock,
  TextAlign,
  TextVariant,
} from "@/types/editor.types";
import CanvasBlockEditor from "./canvas/CanvasBlockEditor.vue";

const block = defineModel<EditorBlock>({ required: true });

const emit = defineEmits<{
  remove: [];
  focus: [];
  insertAfter: [];
  openMenu: [event: MouseEvent];
}>();

const root = ref<HTMLElement | null>(null);

const TEXT_VARIANT_CLASS: Record<TextVariant, string> = {
  normal: "text-(length:--font-size-body-lg) leading-relaxed",
  h1: "text-(length:--font-size-headline-lg) font-semibold leading-tight tracking-tight",
  h2: "text-(length:--font-size-headline-md) font-medium leading-snug",
  quote:
    "border-l-2 border-accent/60 pl-4 text-(length:--font-size-body-lg) leading-relaxed italic text-on-surface-variant",
};

const TEXT_ALIGN_CLASS: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const HIGHLIGHT_CLASS: Record<BlockHighlight, string> = {
  none: "hover:bg-white/[0.02] focus-within:bg-white/[0.03]",
  blue: "block-hl-blue",
  emerald: "block-hl-emerald",
  amber: "block-hl-amber",
  rose: "block-hl-rose",
  violet: "block-hl-violet",
  slate: "block-hl-slate",
};

const highlightClass = computed(
  () => HIGHLIGHT_CLASS[block.value.highlight ?? "none"],
);

/* ---------- Клавиатура в текстовом блоке ---------- */
const onTextKeydown = (e: KeyboardEvent) => {
  if (block.value.type !== "text") return;

  // Enter без Shift создает новый текстовый блок прямо под текущим
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    emit("insertAfter");
    return;
  }

  // Backspace в пустом блоке удаляет его
  if (e.key === "Backspace" && block.value.text === "") {
    e.preventDefault();
    emit("remove");
  }
};

/* ---------- Код ---------- */
const copyCode = () => {
  if (block.value.type === "code") {
    navigator.clipboard.writeText(block.value.code);
  }
};

const onCodeTab = (e: KeyboardEvent) => {
  const el = e.target as HTMLTextAreaElement;
  el.setRangeText("  ", el.selectionStart, el.selectionEnd, "end");
  el.dispatchEvent(new Event("input"));
};

/* ---------- Чек-лист ---------- */
const focusItem = (index: number) =>
  nextTick(() =>
    root.value
      ?.querySelectorAll<HTMLInputElement>("[data-check-input]")
      [index]?.focus(),
  );

const addItem = (after: number) => {
  if (block.value.type !== "checklist") return;
  block.value.items.splice(after + 1, 0, createChecklistItem());
  focusItem(after + 1);
};

const onItemBackspace = (e: KeyboardEvent, index: number) => {
  if (block.value.type !== "checklist") return;
  const items = block.value.items;
  const current = items[index];
  if (current && current.text === "" && items.length > 1) {
    e.preventDefault();
    items.splice(index, 1);
    focusItem(Math.max(0, index - 1));
  }
};

/* ---------- Таблица ---------- */
const addRow = () => {
  if (block.value.type !== "table") return;
  const cols = block.value.rows[0]?.length ?? 1;
  block.value.rows.push(Array<string>(cols).fill(""));
};

const addCol = () => {
  if (block.value.type !== "table") return;
  block.value.rows.forEach((row) => row.push(""));
};
</script>

<template>
  <div
    ref="root"
    :data-block-id="block.id"
    class="group relative my-0.5 rounded-xl px-3 py-1.5 transition-colors"
    :class="highlightClass"
    @focusin="emit('focus')"
    @contextmenu.prevent="emit('openMenu', $event)"
  >
    <!-- Левая панель управления блоком (появляется при наведении как в Notion) -->
    <div
      class="absolute top-1.5 -left-14 flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
    >
      <button
        type="button"
        title="Добавить блок ниже (Enter)"
        class="flex size-6 items-center justify-center rounded-md text-on-surface-variant/60 hover:bg-white/10 hover:text-on-surface"
        @click="emit('insertAfter')"
      >
        <Plus class="size-3.5" />
      </button>
      <button
        type="button"
        title="Меню блока (ПКМ)"
        class="flex size-6 items-center justify-center rounded-md text-on-surface-variant/60 hover:bg-white/10 hover:text-on-surface"
        @click="emit('openMenu', $event)"
      >
        <GripVertical class="size-3.5" />
      </button>
    </div>

    <!-- Правая кнопка удаления -->
    <UiIconButton
      title="Удалить блок"
      class="absolute top-1.5 -right-8 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      @click="emit('remove')"
    >
      <Trash2 class="size-(--toolbar-icon-size)" />
    </UiIconButton>

    <!-- Текст -->
    <textarea
      v-if="block.type === 'text'"
      v-model="block.text"
      data-block-focus
      rows="1"
      spellcheck="true"
      lang="ru"
      placeholder="Пишите здесь… (Enter — новый блок, Shift+Enter — перенос, ПКМ — меню)"
      class="field-sizing-content w-full resize-none border-none bg-transparent text-on-surface shadow-none outline-none placeholder:text-on-surface-variant/35"
      :class="[
        TEXT_VARIANT_CLASS[block.variant],
        TEXT_ALIGN_CLASS[block.align],
      ]"
      @keydown="onTextKeydown"
    />

    <!-- Код -->
    <div
      v-else-if="block.type === 'code'"
      class="my-1 w-full rounded-xl bg-black/25 p-2"
    >
      <div
        class="flex items-center gap-2 border-b border-white/5 px-2 pb-1.5 opacity-85 transition-opacity hover:opacity-100"
      >
        <UiDropdown
          v-model="block.language"
          :options="CODE_LANGUAGES"
          title="Язык"
        />
        <input
          v-model="block.fileName"
          placeholder="имя файла (необязательно)"
          class="min-w-0 flex-1 border-none bg-transparent text-(length:--font-size-caption) text-on-surface-variant outline-none placeholder:text-on-surface-variant/40"
        />
        <UiIconButton title="Копировать код" @click="copyCode">
          <Copy class="size-(--toolbar-icon-size)" />
        </UiIconButton>
      </div>
      <textarea
        v-model="block.code"
        data-block-focus
        rows="3"
        spellcheck="false"
        placeholder="// Вставьте или напишите код…"
        class="field-sizing-content w-full resize-none border-none bg-transparent p-2 font-mono text-sm leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/35"
        @keydown.tab.prevent="onCodeTab"
      />
    </div>

    <!-- Чек-лист -->
    <div v-else-if="block.type === 'checklist'" class="space-y-1.5 py-1">
      <div
        v-for="(item, i) in block.items"
        :key="item.id"
        class="flex items-center gap-2.5"
      >
        <input
          v-model="item.done"
          type="checkbox"
          class="size-4 shrink-0 cursor-pointer rounded accent-accent"
        />
        <input
          v-model="item.text"
          data-check-input
          :data-block-focus="i === 0 ? '' : undefined"
          placeholder="Задача…"
          class="min-w-0 flex-1 border-none bg-transparent py-0.5 text-(length:--font-size-body-lg) text-on-surface outline-none placeholder:text-on-surface-variant/40"
          :class="item.done && 'text-on-surface-variant/50 line-through'"
          @keydown.enter.prevent="addItem(i)"
          @keydown.backspace="onItemBackspace($event, i)"
        />
      </div>
    </div>

    <!-- Таблица -->
    <div v-else-if="block.type === 'table'" class="space-y-2 py-1">
      <div class="overflow-x-auto rounded-lg bg-black/15">
        <table class="w-full border-collapse">
          <tbody>
            <tr
              v-for="(row, r) in block.rows"
              :key="r"
              class="border-b border-white/5 last:border-none"
            >
              <td
                v-for="(_, c) in row"
                :key="c"
                class="border-r border-white/5 p-0 last:border-none"
              >
                <input
                  v-model="row[c]"
                  :data-block-focus="r === 0 && c === 0 ? '' : undefined"
                  placeholder="…"
                  class="w-full min-w-24 border-none bg-transparent px-3 py-2 text-(length:--font-size-body-md) text-on-surface outline-none focus:bg-white/5"
                  :class="r === 0 && 'font-semibold bg-white/[0.03]'"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex gap-2">
        <UiButton label="+ строка" @click="addRow" />
        <UiButton label="+ столбец" @click="addCol" />
      </div>
    </div>

    <!-- Изображение -->
    <figure v-else-if="block.type === 'image'" class="space-y-1.5 py-1">
      <img
        :src="block.src"
        :alt="block.name"
        class="max-h-96 max-w-full rounded-xl object-contain"
      />
      <figcaption
        class="px-1 text-(length:--font-size-caption) text-on-surface-variant/60"
      >
        {{ block.name }}
      </figcaption>
    </figure>

    <!-- Видео -->
    <figure v-else-if="block.type === 'video'" class="space-y-1.5 py-1">
      <video
        :src="block.src"
        controls
        preload="metadata"
        class="max-h-96 w-full rounded-xl"
      />
      <figcaption
        class="px-1 text-(length:--font-size-caption) text-on-surface-variant/60"
      >
        {{ block.name }}
      </figcaption>
    </figure>

    <!-- Аудио -->
    <figure v-else-if="block.type === 'audio'" class="space-y-1.5 py-1">
      <audio :src="block.src" controls class="w-full" />
      <figcaption
        class="px-1 text-(length:--font-size-caption) text-on-surface-variant/60"
      >
        {{ block.name }}
      </figcaption>
    </figure>

    <!-- Файл -->
    <div
      v-else-if="block.type === 'file'"
      class="my-1 flex items-center gap-3 rounded-xl bg-black/20 px-3 py-2.5"
    >
      <div
        class="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"
      >
        <FileText class="size-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-(length:--font-size-body-md) text-on-surface">
          {{ block.name }}
        </p>
        <p class="text-(length:--font-size-caption) text-on-surface-variant/70">
          {{ formatBytes(block.size) }} · {{ block.mime }}
        </p>
      </div>
      <a
        :href="block.src"
        :download="block.name"
        title="Скачать"
        class="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
      >
        <Download class="size-(--toolbar-icon-size)" />
      </a>
    </div>

    <!-- 🌟 Интерактивный холст / Блок-схема -->
    <CanvasBlockEditor v-else-if="block.type === 'canvas'" v-model="block" />

    <!-- Разделитель -->
    <hr v-else-if="block.type === 'divider'" class="my-4 border-white/15" />
  </div>
</template>
