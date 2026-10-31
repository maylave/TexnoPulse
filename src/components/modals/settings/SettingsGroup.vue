<!-- src/components/modals/settings/SettingsGroup.vue -->
<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="w-full mb-6 last:mb-0">
    <!-- Заголовок группы сверху -->
    <h3
      class="text-sm font-semibold uppercase tracking-wider mb-3 px-1"
      style="color: var(--color-on-surface-variant)"
    >
      {{ title }}
    </h3>

    <!-- Контейнер для настроек с отступами между ними -->
    <div class="flex flex-col gap-3">
      <slot />
    </div>
  </div>
</template>
