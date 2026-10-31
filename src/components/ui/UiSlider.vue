<!-- src/components/ui/UiSlider.vue -->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    unit: "",
  },
);

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

const updateValue = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:modelValue", Number(target.value));
};
</script>

<template>
  <div class="flex items-center gap-4 w-full max-w-[200px]">
    <!-- Кастомный range input -->
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="updateValue"
      class="slider-input w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style="background: var(--color-surface-variant)"
    />

    <!-- Отображение значения -->
    <span
      class="text-sm font-medium tabular-nums min-w-[3ch] text-right"
      style="color: var(--color-on-surface)"
    >
      {{ modelValue }}{{ unit }}
    </span>
  </div>
</template>

<style scoped>
/* Стилизация track и thumb через псевдоэлементы */
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 2px solid var(--color-surface-container);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 2px solid var(--color-surface-container);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
