<!-- src/components/ui/AttachmentPicker.vue -->
<script setup lang="ts">
import type { Component } from "vue";
import { X as XIcon } from "lucide-vue-next";

export interface PickerItem {
  id: string;
  icon: Component | string;
  label: string;
  action?: () => void;
}

const props = withDefaults(
  defineProps<{
    items?: PickerItem[];
  }>(),
  {
    items: () => [],
  },
);

const emit = defineEmits<{ close: [] }>();

const handleClick = (item: PickerItem) => {
  if (item.action) {
    item.action();
  }
  emit("close");
};
</script>

<template>
  <div
    class="attachment-picker z-50 p-4 rounded-3xl panel-glass select-none"
    style="width: min(360px, 90vw);"
    @click.stop
  >
    <!-- Заголовок -->
    <div class="flex items-center justify-between mb-3 px-1">
      <span
        class="text-xs font-semibold uppercase tracking-wider opacity-60"
        style="color: var(--input-text, #ffffff)"
      >
        Вложения
      </span>
      <button
        type="button"
        @click="$emit('close')"
        class="size-7 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
        style="color: var(--input-text, #ffffff); opacity: 0.7;"
        title="Закрыть"
      >
        <XIcon class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Сетка иконок 3x3 -->
    <div class="grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar p-0.5">
      <button
        v-for="item in props.items"
        :key="item.id"
        type="button"
        @click="handleClick(item)"
        class="group relative flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl border border-white/5 bg-white/[0.03] transition-all duration-200 hover:border-white/15 hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98]"
      >
        <!-- Контейнер иконки -->
        <div
          class="size-9 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-sky-500/15 group-hover:text-sky-300 transition-colors"
          style="color: var(--input-text, #ffffff)"
        >
          <component
            :is="item.icon"
            class="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
            :stroke-width="1.8"
          />
        </div>

        <span
          class="text-xs font-medium text-center truncate max-w-full group-hover:text-sky-300 transition-colors"
          style="color: var(--input-text, #ffffff); opacity: 0.85;"
        >
          {{ item.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel-glass {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.75));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 16px 40px rgba(0, 0, 0, 0.45)),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}
</style>
