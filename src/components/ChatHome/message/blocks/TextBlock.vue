<!-- src/components/ChatHome/message/blocks/TextBlock.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { TextContent } from "@/types/message";
import ColorBlock from "./ColorBlock.vue";

const props = defineProps<{
  block: TextContent;
}>();

const COLOR_REGEX =
  /#(?:[0-9a-fA-F]{3,4}){1,2}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi;

// Все найденные цвета в сообщении
const extractedColors = computed(() => {
  return props.block.text.match(COLOR_REGEX) ?? [];
});

// Проверяем, состоит ли сообщение ИСКЛЮЧИТЕЛЬНО из цветов (и пробелов/запятых)
const isPureColorMessage = computed(() => {
  if (extractedColors.value.length === 0) return false;
  const stripped = props.block.text
    .replace(COLOR_REGEX, "")
    .replace(/[\s,;]+/g, "");
  return stripped.length === 0;
});

const variantClasses = computed(() => {
  switch (props.block.variant) {
    case "h1":
      return "text-lg font-bold tracking-tight";
    case "h2":
      return "text-base font-semibold";
    case "quote":
      return "border-l-2 border-sky-400/60 pl-3 italic opacity-85";
    default:
      return "";
  }
});

const alignClasses = computed(() => {
  switch (props.block.align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
});
</script>

<template>
  <!-- Если ввели только HEX / RGB коды — рисуем закругленный квадрат (деленный пополам/на части) -->
  <div v-if="isPureColorMessage" class="-mx-3.5 -my-2.5">
    <ColorBlock :colors="extractedColors" />
  </div>

  <!-- Обычный текст (с поддержкой заголовков, цитат и превью цветов, если они встречаются в тексте) -->
  <div v-else class="space-y-2">
    <p
      class="whitespace-pre-wrap break-words"
      :class="[variantClasses, alignClasses]"
    >
      {{ block.text }}
    </p>

    <!-- Если в обычном тексте упомянут цвет, показываем компактную палитру снизу -->
    <div v-if="extractedColors.length > 0" class="pt-1">
      <ColorBlock :colors="extractedColors" />
    </div>
  </div>
</template>
