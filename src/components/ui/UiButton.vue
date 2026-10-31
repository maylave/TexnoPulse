<!-- src/components/ui/UiButton.vue -->
<script setup lang="ts">
defineProps<{ label: string }>();
defineEmits<{ click: [] }>();
</script>

<template>
  <button
    type="button"
    @click="$emit('click')"
    class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border"
    style="
      background-color: var(--color-surface-container-lowest);
      color: var(--color-on-surface);
      border-color: var(--menu-border);
    "
    @mouseenter="
      (e) =>
        ((e.currentTarget as HTMLElement).style.borderColor =
          'var(--color-outline)')
    "
    @mouseleave="
      (e) =>
        ((e.currentTarget as HTMLElement).style.borderColor =
          'var(--menu-border)')
    "
  >
    {{ label }}
  </button>
</template>
