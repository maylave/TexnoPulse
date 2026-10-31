<!-- src/components/ChatHome/message/blocks/ChecklistBlock.vue -->
<script setup lang="ts">
import type { ChecklistContent } from "@/types/message";

defineProps<{
  block: ChecklistContent;
}>();
</script>

<template>
  <div class="px-3.5 py-2.5 space-y-2 min-w-[200px]">
    <div v-if="block.title" class="text-xs font-semibold opacity-90">
      {{ block.title }}
    </div>
    <div class="space-y-1.5">
      <label
        v-for="item in block.items"
        :key="item.id"
        class="flex items-center gap-2.5 cursor-pointer select-none group"
        @click="item.isChecked = !item.isChecked"
      >
        <div
          class="w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0"
          :class="
            item.isChecked
              ? 'bg-sky-500 border-sky-500 text-white'
              : 'border-white/30 bg-white/5 group-hover:border-white/50'
          "
        >
          <svg
            v-if="item.isChecked"
            class="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <span
          class="text-xs transition-all"
          :class="item.isChecked ? 'line-through opacity-50' : ''"
        >
          {{ item.text }}
        </span>
      </label>
    </div>
  </div>
</template>
