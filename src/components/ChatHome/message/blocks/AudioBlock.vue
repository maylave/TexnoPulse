<!-- src/components/ChatHome/message/blocks/AudioBlock.vue -->
<script setup lang="ts">
import type { AudioContent } from "@/types/message";

defineProps<{
  block: AudioContent;
}>();
</script>

<template>
  <div class="px-3 py-2 min-w-[240px]">
    <audio :src="block.url" controls class="w-full h-9" />
  </div>
</template>
