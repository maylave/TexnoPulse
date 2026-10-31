<!-- src/components/ui/UiNumberInput.vue -->
<script setup lang="ts">
// 1. Явно получаем props через defineProps
const props = defineProps<{
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
}>();

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

// 2. Теперь props.min и props.max доступны
const update = (e: Event) => {
  const target = e.target as HTMLInputElement;
  let val = Number(target.value);

  if (props.min !== undefined && val < props.min) val = props.min;
  if (props.max !== undefined && val > props.max) val = props.max;

  emit("update:modelValue", val);
};
</script>

<template>
  <input
    type="number"
    :value="modelValue"
    @input="update"
    :min="min"
    :max="max"
    :step="step || 1"
    class="w-20 px-3 py-2 text-sm rounded-md outline-none transition-all duration-200 border text-center bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-[var(--menu-border)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
  />
</template>
