<!-- src/components/modals/settings/SettingsItem.vue -->
<script setup lang="ts">
import type { SettingsMenuItem } from "@/types/settings";

defineProps<{
  item: SettingsMenuItem;
  active: boolean;
}>();

const emit = defineEmits<{
  (e: "click", id: string): void;
}>();
</script>

<template>
  <button
    type="button"
    class="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--sidebar-item-radius)] text-left transition-all duration-200 group"
    :class="[
      active ? 'font-medium' : 'hover:bg-white/5 opacity-70 hover:opacity-100',
    ]"
    :style="{
      backgroundColor: active ? 'var(--color-accent)' : 'transparent',
      color: active ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
    }"
    @click="emit('click', item.id)"
  >
    <component
      v-if="item.icon"
      :is="item.icon"
      class="size-5 shrink-0 transition-colors"
      :style="{
        color: active
          ? 'var(--color-on-primary)'
          : 'var(--color-on-surface-variant)',
      }"
    />

    <span class="truncate">{{ item.label }}</span>
  </button>
</template>
