<!-- src/components/ChatHome/message/blocks/ColorBlock.vue -->
<script lang="ts" setup>
import { computed, ref } from "vue";
import type { ColorContent } from "@/types/message";

const props = defineProps<{
  block?: ColorContent;
  colors?: string[];
}>();

const copiedColor = ref<string | null>(null);

// Извлекаем список цветов из пропса colors или из block.value
const colorList = computed<string[]>(() => {
  if (props.colors && props.colors.length > 0) {
    return props.colors;
  }
  if (props.block?.value) {
    // На случай если в block.value передано несколько цветов через пробел/запятую
    const matches = props.block.value.match(
      /#(?:[0-9a-fA-F]{3,4}){1,2}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi,
    );
    return matches && matches.length > 0 ? matches : [props.block.value];
  }
  return ["#000000"];
});

const height = computed(() => {
  const baseHeight = 240;
  const extraColors = Math.max(0, colorList.value.length - 4);
  return `${baseHeight + extraColors * 50}px`;
});

const handleCopy = (color: string) => {
  navigator.clipboard.writeText(color);
  copiedColor.value = color;
  setTimeout(() => {
    if (copiedColor.value === color) copiedColor.value = null;
  }, 1200);
};
</script>

<template>
  <div
    class="group relative w-[240px] rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
    :style="{ height }"
  >
    <div class="flex flex-col w-full h-full">
      <div
        v-for="(color, idx) in colorList"
        :key="`${color}-${idx}`"
        class="flex-1 w-full relative flex items-center justify-center group/color transition-all duration-300"
        :style="{ backgroundColor: color }"
        @click.stop="handleCopy(color)"
      >
        <div
          class="absolute inset-0 bg-black/35 opacity-0 group-hover/color:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]"
        >
          <span
            class="text-white font-mono font-bold text-sm drop-shadow-md select-none px-2 py-1 rounded bg-black/40"
          >
            {{ copiedColor === color ? "Скопировано!" : color.toUpperCase() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
