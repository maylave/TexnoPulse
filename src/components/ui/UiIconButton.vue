<!-- src/components/ui/UiIconButton.vue -->
<script setup lang="ts">
defineProps<{ title: string; active?: boolean }>();
</script>

<template>
  <button
    type="button"
    :title="title"
    :aria-label="title"
    :aria-pressed="active"
    class="flex size-(--toolbar-btn-size) shrink-0 cursor-pointer items-center justify-center rounded-(--toolbar-radius) text-(--toolbar-btn-text) transition-all duration-(--toolbar-anim) hover:bg-(--toolbar-btn-hover) hover:text-(--toolbar-btn-text-hover) active:scale-90 aria-pressed:bg-(--toolbar-btn-active) aria-pressed:text-accent"
  >
    <slot />
  </button>
</template>
