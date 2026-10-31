<!-- src/components/ChatHome/message/blocks/FileBlock.vue -->
<script setup lang="ts">
import { FileText, Download } from "lucide-vue-next";
import type { Message } from "@/types/message";

type FileBlockType = Extract<Message["content"][number], { type: "file" }>;

defineProps<{
  block: FileBlockType;
}>();
</script>

<template>
  <a
    :href="block.url"
    download
    target="_blank"
    class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group cursor-pointer"
  >
    <div
      class="size-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0"
    >
      <FileText class="w-5 h-5" />
    </div>

    <div class="flex flex-col min-w-0 flex-1">
      <span
        class="text-xs font-medium truncate text-on-surface group-hover:underline"
      >
        {{ block.name }}
      </span>
      <span class="text-[10px] text-on-surface-variant opacity-60">
        {{ block.size || "Файл" }}
      </span>
    </div>

    <div
      class="text-on-surface-variant opacity-60 group-hover:opacity-100 transition-opacity"
    >
      <Download class="w-4 h-4" />
    </div>
  </a>
</template>
