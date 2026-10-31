<!-- src/components/ChatHome/right-sidebar/SidebarHeader.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div
    class="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0"
  >
    <h3 class="font-medium text-sm text-white">Информация о чате</h3>

    <button
      type="button"
      class="p-1.5 rounded-lg text-[var(--color-on-surface-variant)] hover:bg-white/10 hover:text-white transition-colors"
      title="Закрыть панель"
      @click="emit('close')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>
