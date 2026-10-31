<!-- src/components/ChatHome/sidebar/FolderRow.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { Folder } from "lucide-vue-next";
import type { AppNode } from "@/types/chat";
import { getNodeIcon } from "@/utils/nodeIcons";

const props = defineProps<{
  node: AppNode;
}>();

const folderMeta = computed(() => props.node.metaDate.folder);

// Иконка из справочника; если id неизвестен, это старое значение (эмодзи) и покажем его текстом
const iconComp = computed(() => getNodeIcon(folderMeta.value?.icon));
const legacyIcon = computed(() =>
  !iconComp.value && folderMeta.value?.icon ? folderMeta.value.icon : "",
);
</script>

<template>
  <div
    class="flex items-center p-2 rounded-[var(--sidebar-item-radius,0.5rem)] cursor-pointer text-[var(--color-on-surface-variant)] hover:bg-[var(--menu-hover)] hover:text-[var(--color-on-surface)] transition-colors"
  >
    <!-- Иконка стрелочки (развернуто/свернуто) -->
    <span
      class="mr-1.5 shrink-0 transition-transform duration-200"
      :class="{ '-rotate-90': folderMeta?.collapsed }"
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

    <!-- Иконка папки: выбранная, эмодзи (старые данные) или обычная папка -->
    <span
      class="mr-2.5 flex shrink-0 items-center"
      :style="{ color: folderMeta?.color }"
    >
      <span v-if="legacyIcon" class="text-sm">{{ legacyIcon }}</span>
      <component :is="iconComp ?? Folder" v-else class="h-4 w-4" />
    </span>

    <span class="text-sm font-medium flex-1 truncate">{{ node.label }}</span>

    <!-- Слот для кастомных действий (например, добавить чат в папку) -->
    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
      <slot></slot>
    </div>
  </div>
</template>