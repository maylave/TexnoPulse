<!-- src/components/ui/UiToggle.vue -->
<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const toggle = () => emit("update:modelValue", !props.modelValue);
</script>

<template>
  <button
    type="button"
    @click="toggle"
    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
    :class="
      modelValue
        ? 'bg-[var(--color-accent)]'
        : 'bg-[var(--color-surface-variant)]'
    "
  >
    <span
      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
    />
  </button>
</template>
