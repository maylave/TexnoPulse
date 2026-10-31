<!-- src/components/ui/UiColorPicker.vue -->
<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

// Явно указываем тип HTMLInputElement и начальное значение null
const colorInput = ref<HTMLInputElement | null>(null);

const updateColor = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};

const triggerInput = () => {
  // Безопасный вызов click() с проверкой на null
  colorInput.value?.click();
};
</script>

<template>
  <div class="relative flex items-center gap-3">
    <!-- Превью выбранного цвета -->
    <div
      class="size-8 rounded-full border-2 shadow-sm cursor-pointer transition-transform hover:scale-105 shrink-0"
      :style="{
        backgroundColor: modelValue,
        borderColor: 'var(--menu-border)',
      }"
      @click="triggerInput"
    />

    <!-- Скрытый нативный input -->
    <input
      ref="colorInput"
      type="color"
      :value="modelValue"
      @input="updateColor"
      class="absolute opacity-0 pointer-events-none w-0 h-0"
    />

    <!-- Текстовое значение (hex) -->
    <span
      class="text-xs font-mono px-2 py-1 rounded select-all cursor-pointer"
      style="
        background: var(--color-surface-container-lowest);
        color: var(--color-on-surface-variant);
      "
      @click="triggerInput"
    >
      {{ modelValue.toUpperCase() }}
    </span>
  </div>
</template>
