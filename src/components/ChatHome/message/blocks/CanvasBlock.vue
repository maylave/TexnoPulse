<!-- src/components/ChatHome/message/blocks/CanvasBlock.vue -->
<script setup lang="ts">
import type { CanvasContent } from "@/types/message";

defineProps<{
  block: CanvasContent;
}>();
</script>

<template>
  <div class="px-3.5 py-2.5 min-w-[240px]">
    <div
      class="relative w-full rounded-xl bg-black/25 border border-white/10 overflow-hidden flex items-center justify-center p-3"
      :style="{ height: `${block.height || 180}px` }"
    >
      <svg class="w-full h-full">
        <path
          v-for="(stroke, idx) in block.strokes"
          :key="idx"
          :d="stroke.path || ''"
          :stroke="stroke.color || '#38bdf8'"
          :stroke-width="stroke.width || 2"
          fill="none"
          stroke-linecap="round"
        />
      </svg>
      <span
        v-if="!block.strokes?.length && !block.nodes?.length"
        class="text-xs opacity-40"
      >
        Холст / Схема
      </span>
    </div>
  </div>
</template>
