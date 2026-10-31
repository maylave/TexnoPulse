<!-- src/components/editor/EditorContextMenu.vue -->
<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  nextTick,
} from "vue";
import { CopyPlus, Trash2, Sparkles } from "lucide-vue-next";
import { TOOLBAR_TABS, TOOLBAR_AI_ITEM } from "@/config/toolbar.config";
import { BLOCK_HIGHLIGHTS } from "./editor.blocks";
import type {
  EditorAction,
  ToolbarButtonItem,
  ToolbarSelectItem,
} from "@/types/toolbar.types";
import type { BlockHighlight } from "@/types/editor.types";

const props = defineProps<{
  isOpen: boolean;
  x: number;
  y: number;
  currentHighlight?: BlockHighlight;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "format", action: EditorAction, value?: unknown): void;
}>();

const menuRef = ref<HTMLElement | null>(null);
const pos = ref({ left: 0, top: 0 });

// Достаем все элементы из вкладки "Главная" и "Вставка" прямо из твоего конфига
const homeTab = computed(() => TOOLBAR_TABS.find((t) => t.id === "home"));
const insertTab = computed(() => TOOLBAR_TABS.find((t) => t.id === "insert"));

const variantSelect = computed(() =>
  homeTab.value?.groups
    .flatMap((g) => g.items)
    .find(
      (i): i is ToolbarSelectItem => i.type === "select" && i.id === "variant",
    ),
);

const inlineButtons = computed(() =>
  (homeTab.value?.groups.find((g) => g.id === "inline")?.items ?? []).filter(
    (i): i is ToolbarButtonItem => i.type === "button",
  ),
);

const alignButtons = computed(() =>
  (homeTab.value?.groups.find((g) => g.id === "align")?.items ?? []).filter(
    (i): i is ToolbarButtonItem => i.type === "button",
  ),
);

const listButtons = computed(() =>
  (homeTab.value?.groups.find((g) => g.id === "lists")?.items ?? []).filter(
    (i): i is ToolbarButtonItem => i.type === "button",
  ),
);

const insertButtons = computed(() =>
  (insertTab.value?.groups.flatMap((g) => g.items) ?? []).filter(
    (i): i is ToolbarButtonItem => i.type === "button",
  ),
);

const trigger = (action: EditorAction, value?: unknown) => {
  emit("format", action, value);
  emit("close");
};

// Корректируем координаты, чтобы меню не уходило за края экрана
watch(
  () => [props.isOpen, props.x, props.y],
  async ([open]) => {
    if (!open) return;
    pos.value = { left: props.x, top: props.y };
    await nextTick();
    const el = menuRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - 12;
    const maxTop = window.innerHeight - rect.height - 12;
    pos.value = {
      left: Math.max(12, Math.min(props.x, maxLeft)),
      top: Math.max(12, Math.min(props.y, maxTop)),
    };
  },
);

const onOutside = (e: MouseEvent) => {
  if (
    props.isOpen &&
    menuRef.value &&
    !menuRef.value.contains(e.target as Node)
  ) {
    emit("close");
  }
};

onMounted(() => document.addEventListener("mousedown", onOutside));
onBeforeUnmount(() => document.removeEventListener("mousedown", onOutside));
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      leave-active-class="transition duration-100 ease-in"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        ref="menuRef"
        :style="{ left: `${pos.left}px`, top: `${pos.top}px` }"
        class="fixed z-[100] w-72 rounded-2xl border border-white/10 bg-[#0d1c2d]/95 p-2 text-xs text-on-surface shadow-2xl backdrop-blur-2xl select-none"
        @contextmenu.prevent
      >
        <!-- 1. Быстрые кнопки форматирования и выравнивания в один ряд -->
        <div
          class="flex items-center justify-between gap-1 rounded-xl bg-white/[0.03] p-1"
        >
          <div class="flex items-center gap-0.5">
            <button
              v-for="btn in inlineButtons"
              :key="btn.id"
              type="button"
              :title="btn.label"
              class="flex size-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
              @click="trigger(btn.action, btn.value)"
            >
              <component :is="btn.icon" class="size-3.5" />
            </button>
          </div>
          <div class="h-4 w-px bg-white/10" />
          <div class="flex items-center gap-0.5">
            <button
              v-for="btn in alignButtons"
              :key="btn.id"
              type="button"
              :title="btn.label"
              class="flex size-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
              @click="trigger(btn.action, btn.value)"
            >
              <component :is="btn.icon" class="size-3.5" />
            </button>
          </div>
        </div>

        <!-- 2. Тип текста (Абзац / H1 / H2 / Цитата) -->
        <div v-if="variantSelect" class="mt-2">
          <p
            class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50"
          >
            Стиль текста
          </p>
          <div class="grid grid-cols-2 gap-1">
            <button
              v-for="opt in variantSelect.options"
              :key="opt.value"
              type="button"
              class="rounded-lg px-2.5 py-1.5 text-left text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
              @click="trigger('variant', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 3. Выделение блока цветом -->
        <div class="mt-2 border-t border-white/10 pt-2">
          <p
            class="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50"
          >
            Цвет блока
          </p>
          <div class="flex items-center justify-between px-2 py-1">
            <button
              v-for="hl in BLOCK_HIGHLIGHTS"
              :key="hl.value"
              type="button"
              :title="hl.label"
              class="size-5 rounded-full border transition-transform hover:scale-125"
              :class="[
                hl.dot,
                currentHighlight === hl.value
                  ? 'border-white ring-2 ring-accent'
                  : 'border-white/20',
              ]"
              @click="trigger('highlight', hl.value)"
            />
          </div>
        </div>

        <!-- 4. Вставка любого блока подряд -->
        <div class="mt-2 border-t border-white/10 pt-2">
          <p
            class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/50"
          >
            Добавить блок ниже
          </p>
          <div class="grid grid-cols-2 gap-0.5 max-h-40 overflow-y-auto">
            <button
              v-for="btn in [...listButtons, ...insertButtons]"
              :key="btn.id"
              type="button"
              class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
              @click="trigger(btn.action, btn.value)"
            >
              <component :is="btn.icon" class="size-3.5 shrink-0 text-accent" />
              <span class="truncate">{{ btn.label }}</span>
            </button>
          </div>
        </div>

        <!-- 5. ИИ + Управление блоком -->
        <div class="mt-2 border-t border-white/10 pt-1.5 space-y-0.5">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-accent transition-colors hover:bg-accent/15"
            @click="trigger(TOOLBAR_AI_ITEM.action)"
          >
            <Sparkles class="size-3.5" />
            <span>Улучшить текст с ИИ</span>
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
            @click="trigger('duplicate_block')"
          >
            <CopyPlus class="size-3.5" />
            <span>Дублировать блок</span>
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-400 transition-colors hover:bg-rose-500/15"
            @click="trigger('delete_block')"
          >
            <Trash2 class="size-3.5" />
            <span>Удалить блок</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
