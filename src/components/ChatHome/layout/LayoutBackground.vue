<script lang="ts" setup>
import type { ChatBackground } from "@/types/background";

defineProps<{
  background: ChatBackground;
}>();
</script>

<template>
  <div class="absolute inset-0 transition-all duration-500 overflow-hidden">
    <!-- 1. SOLID COLOR -->
    <div
      v-if="background.type === 'solid'"
      class="absolute inset-0"
      :style="{ backgroundColor: background.value }"
    />

    <!-- 2. GRADIENT -->
    <div
      v-else-if="background.type === 'gradient'"
      class="absolute inset-0 bg-gradient-to-br"
      :class="background.value"
    />

    <!-- 3. PATTERN -->
    <div
      v-else-if="background.type === 'pattern'"
      class="absolute inset-0"
      :style="{
        backgroundImage: background.value,
        backgroundSize: '20px 20px',
      }"
    />

    <div
      v-else-if="background.type === 'image'"
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url('${background.value}')` }"
    >
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
    </div>

    <div
      v-if="
        !['solid', 'gradient', 'pattern', 'image'].includes(background.type)
      "
      class="absolute inset-0 bg-slate-900"
    />
  </div>
</template>
