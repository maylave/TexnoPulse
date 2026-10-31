<!-- src/components/chat/AttachmentTray.vue -->
<script setup lang="ts">
import { X, FileText, Image, Video } from "lucide-vue-next";
import type { Component } from "vue";

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string; // Для картинок/видео
}

defineProps<{
  files: AttachedFile[];
}>();

const emit = defineEmits<{
  remove: [id: string];
}>();

// Форматирование размера файла
const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Выбор иконки по типу файла
const getFileIcon = (type: string): Component => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Video;
  return FileText;
};
</script>

<template>
  <div
    v-if="files.length > 0"
    class="attachment-tray flex gap-2 mb-3 px-1 overflow-x-auto custom-scrollbar"
  >
    <div
      v-for="file in files"
      :key="file.id"
      class="flex items-center gap-3 pl-3 pr-2 py-2 rounded-full border backdrop-blur-md transition-all hover:bg-white/5 group shrink-0"
      style="
        background: var(--input-bg);
        border-color: var(--menu-border);
        color: var(--input-text);
      "
    >
      <!-- Иконка или превью -->
      <div
        class="size-8 rounded-full flex items-center justify-center bg-white/5 shrink-0"
      >
        <img
          v-if="file.previewUrl"
          :src="file.previewUrl"
          class="w-full h-full object-cover rounded-full"
        />
        <component
          v-else
          :is="getFileIcon(file.type)"
          class="w-4 h-4 opacity-70"
        />
      </div>

      <!-- Информация о файле -->
      <div class="flex flex-col min-w-0 max-w-[150px]">
        <span class="text-sm font-medium truncate leading-tight">{{
          file.name
        }}</span>
        <span class="text-xs opacity-50 uppercase leading-tight">
          {{ file.type.split("/")[1] || "FILE" }} · {{ formatSize(file.size) }}
        </span>
      </div>

      <!-- Кнопка удаления -->
      <button
        @click="emit('remove', file.id)"
        class="size-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ml-1"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 0px;
  display: none;
}
</style>
