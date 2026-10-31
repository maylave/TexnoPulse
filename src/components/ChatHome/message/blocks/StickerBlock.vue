<!-- src/components/ChatHome/message/blocks/StickerBlock.vue -->
<script setup lang="ts">
import type { StickerContent } from "@/types/message";
defineProps<{ block: StickerContent }>();
</script>

<template>
  <div class="p-1">
    <img
      :src="block.url"
      alt="Стикер"
      class="w-32 h-32 object-contain select-none"
    />
  </div>
</template>
