<script setup lang="ts">
import type { AppNode } from "@/types/chat";

defineProps<{
  node: AppNode;
}>();
</script>

<template>
  <div
    class="flex items-center p-2 rounded-[var(--sidebar-item-radius,0.5rem)] cursor-pointer text-[var(--color-on-surface-variant)] hover:bg-[var(--menu-hover)] hover:text-[var(--color-on-surface)] transition-colors"
  >
    <!-- Иконка стрелочки (развернуто/свернуто) -->
    <span
      class="mr-1.5 shrink-0 transition-transform duration-200"
      :class="{ '-rotate-90': node.metaDate.folder?.collapsed }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </span>

    <!-- Иконка папки (кастомная или по умолчанию) -->
    <span
      class="mr-2.5 shrink-0"
      :style="{ color: node.metaDate.folder?.color }"
    >
      <svg
        v-if="!node.metaDate.folder?.icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        ></path>
      </svg>
      <span v-else class="text-sm">{{ node.metaDate.folder.icon }}</span>
    </span>

    <span class="text-sm font-medium flex-1 truncate">{{ node.label }}</span>

    <!-- Слот для кастомных действий (например, добавить чат в папку) -->
    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
      <slot></slot>
    </div>
  </div>
</template>
