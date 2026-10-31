<!-- src/components/ChatHome/message/blocks/PollBlock.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { PollContent, PollOption } from "@/types/message";

const props = defineProps<{
  block: PollContent;
}>();

const totalVotes = computed(() =>
  props.block.options.reduce((acc, o) => acc + (o.votes || 0), 0),
);

const vote = (option: PollOption) => {
  if (!props.block.allowMultiple) {
    props.block.options.forEach((o) => {
      if (o.id !== option.id && o.isSelected) {
        o.isSelected = false;
        o.votes = Math.max(0, (o.votes || 1) - 1);
      }
    });
  }
  option.isSelected = !option.isSelected;
  option.votes = (option.votes || 0) + (option.isSelected ? 1 : -1);
};
</script>

<template>
  <div class="px-3.5 py-2.5 space-y-2.5 min-w-[230px]">
    <div class="text-xs font-semibold">{{ block.question }}</div>
    <div class="space-y-1.5">
      <button
        v-for="opt in block.options"
        :key="opt.id"
        type="button"
        class="w-full relative overflow-hidden rounded-lg border px-3 py-1.5 text-left text-xs transition-all"
        :class="
          opt.isSelected
            ? 'border-sky-400 bg-sky-500/15'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        "
        @click="vote(opt)"
      >
        <div class="relative z-10 flex justify-between items-center gap-2">
          <span>{{ opt.text }}</span>
          <span class="text-[10px] opacity-60">{{ opt.votes || 0 }}</span>
        </div>
      </button>
    </div>
    <div class="text-[10px] opacity-50">Проголосовало: {{ totalVotes }}</div>
  </div>
</template>
