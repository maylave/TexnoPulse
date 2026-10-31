<!-- src/components/editor/toolbar/EditorToolbar.vue -->
<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ChevronUp, Palette } from "lucide-vue-next";
import UiButton from "@/components/ui/UiButton.vue";
import UiDropdown from "@/components/ui/UiDropdown.vue";
import UiIconButton from "@/components/ui/UiIconButton.vue";
import { TOOLBAR_TABS, TOOLBAR_AI_ITEM } from "@/config/toolbar.config";
import { BLOCK_HIGHLIGHTS, EDITOR_THEMES } from "../editor.blocks";
import type {
  EditorAction,
  ToolbarButtonItem,
  ToolbarSelectItem,
} from "@/types/toolbar.types";
import type { BlockHighlight, EditorTheme } from "@/types/editor.types";

defineProps<{
  currentTheme: EditorTheme;
  currentHighlight?: BlockHighlight;
}>();

const emit = defineEmits<{
  (e: "format", action: EditorAction, value?: unknown): void;
  (e: "collapse"): void;
}>();

const activeTabId = ref(TOOLBAR_TABS[0].id);
const activeTab = computed(
  () => TOOLBAR_TABS.find((t) => t.id === activeTabId.value) ?? TOOLBAR_TABS[0],
);

const selectState = reactive<Record<string, string | number>>(
  Object.fromEntries(
    TOOLBAR_TABS.flatMap((t) => t.groups.flatMap((g) => g.items))
      .filter((i): i is ToolbarSelectItem => i.type === "select")
      .map((i) => [i.id, i.defaultValue]),
  ),
);

const triggerFormat = (action: EditorAction, value?: unknown) => {
  emit("format", action, value);
};

const onSelect = (item: ToolbarSelectItem, value: string | number) => {
  selectState[item.id] = value;
  triggerFormat(item.action, value);
};

const titleOf = (item: ToolbarButtonItem) =>
  item.shortcut ? `${item.label} (${item.shortcut})` : item.label;
</script>

<template>
  <div
    class="relative z-20 flex flex-col border-b border-(--toolbar-border) bg-(--toolbar-bg) backdrop-blur-xl transition-all"
  >
    <!-- Верхний ряд: Вкладки + Темы UI Kit + ИИ + Скрытие шапки -->
    <div role="tablist" class="flex items-center gap-1 px-6 pt-2">
      <button
        v-for="tab in TOOLBAR_TABS"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="tab.id === activeTabId"
        class="relative cursor-pointer px-3 py-1.5 text-(length:--toolbar-font-size) font-medium text-(--toolbar-tab-text) transition-colors duration-(--toolbar-anim) after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-(--toolbar-tab-indicator) after:opacity-0 after:transition-opacity hover:text-(--toolbar-tab-text-active) aria-selected:text-(--toolbar-tab-text-active) aria-selected:after:opacity-100"
        @click="activeTabId = tab.id"
      >
        {{ tab.label }}
      </button>

      <div class="ml-auto flex items-center gap-2">
        <!-- Переключатель тем (UI Kit) -->
        <div
          class="flex items-center gap-1 rounded-lg border border-(--toolbar-border) bg-black/15 px-2 py-1"
        >
          <Palette class="size-3.5 text-on-surface-variant opacity-70" />
          <button
            v-for="t in EDITOR_THEMES"
            :key="t.value"
            type="button"
            :title="`Тема: ${t.label}`"
            class="size-4 rounded-full border transition-transform hover:scale-110"
            :class="
              currentTheme === t.value
                ? 'border-accent scale-110 ring-2 ring-accent/40'
                : 'border-white/20 opacity-70'
            "
            :style="{ backgroundColor: t.preview }"
            @click="triggerFormat('theme', t.value)"
          />
        </div>

        <UiButton
          variant="accent"
          :title="TOOLBAR_AI_ITEM.label"
          class="h-(--toolbar-btn-size)"
          @click="triggerFormat(TOOLBAR_AI_ITEM.action)"
        >
          <component
            :is="TOOLBAR_AI_ITEM.icon"
            class="size-(--toolbar-icon-size) text-accent"
          />
          <span>Улучшить с ИИ</span>
        </UiButton>

        <!-- Кнопка сворачивания шапки -->
        <UiIconButton
          title="Скрыть панель инструментов (Ctrl+\)"
          @click="emit('collapse')"
        >
          <ChevronUp class="size-(--toolbar-icon-size)" />
        </UiIconButton>
      </div>
    </div>

    <!-- Нижний ряд: Инструменты активной вкладки + Цветовое выделение блока -->
    <div role="toolbar" class="flex flex-wrap items-center gap-1.5 px-6 py-2.5">
      <template v-for="(group, gi) in activeTab.groups" :key="group.id">
        <div
          v-if="gi > 0"
          class="mx-1 h-(--toolbar-divider-height) w-px bg-(--toolbar-divider)"
        />

        <template v-for="item in group.items" :key="item.id">
          <UiDropdown
            v-if="item.type === 'select'"
            :model-value="selectState[item.id]"
            :options="item.options"
            :title="item.label"
            @update:model-value="onSelect(item, $event)"
          />

          <UiIconButton
            v-else
            :title="titleOf(item)"
            @click="triggerFormat(item.action, item.value)"
          >
            <component :is="item.icon" class="size-(--toolbar-icon-size)" />
          </UiIconButton>
        </template>
      </template>

      <div
        class="mx-1 h-(--toolbar-divider-height) w-px bg-(--toolbar-divider)"
      />

      <!-- Быстрое выделение текущего блока цветом -->
      <div class="flex items-center gap-1 pl-1" title="Выделить блок цветом">
        <button
          v-for="hl in BLOCK_HIGHLIGHTS"
          :key="hl.value"
          type="button"
          :title="hl.label"
          class="size-4 rounded-full border transition-transform hover:scale-125"
          :class="[
            hl.dot,
            currentHighlight === hl.value
              ? 'border-white ring-2 ring-accent/50 scale-110'
              : 'border-white/15 opacity-75 hover:opacity-100',
          ]"
          @click="triggerFormat('highlight', hl.value)"
        />
      </div>
    </div>
  </div>
</template>
