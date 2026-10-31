<!-- src/components/ChatHome/message/blocks/DividerBlock.vue -->
<script setup lang="ts">
import type { DividerContent } from "@/types/message";
defineProps<{ block: DividerContent }>();
</script>

<template>
  <div class="px-3.5 py-1.5">
    <div class="h-px w-full bg-white/15" />
  </div>
</template>
