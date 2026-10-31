<!-- src/components/modals/settings/SettingsBlock.vue -->
<script setup lang="ts">
defineProps<{
  label: string;
  description?: string;
}>();
</script>

<template>
  <div
    class="flex items-center justify-between w-full p-4 rounded-[var(--radius-lg)] border transition-colors"
    style="
      background-color: var(--color-surface-container-high);
      border-color: var(--menu-border);
    "
  >
    <!-- Левая часть: Текст -->
    <div class="flex-1 pr-6 min-w-0">
      <h3
        class="text-sm font-medium leading-tight"
        style="color: var(--color-on-surface)"
      >
        {{ label }}
      </h3>
      <p
        v-if="description"
        class="text-xs mt-1 opacity-60 truncate"
        style="color: var(--color-on-surface-variant)"
      >
        {{ description }}
      </p>
    </div>

    <!-- Правая часть: Контрол (передается через слот) -->
    <div class="shrink-0 flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>
