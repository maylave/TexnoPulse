<!-- src/components/ui/UiInput.vue -->
<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

// Используем типизированный обработчик
const update = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <input
    type="text"
    :value="modelValue"
    @input="update"
    :placeholder="placeholder"
    class="w-full max-w-[240px] px-3 py-2 text-sm rounded-md outline-none transition-all duration-200 border bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border-[var(--menu-border)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
  />
</template>
