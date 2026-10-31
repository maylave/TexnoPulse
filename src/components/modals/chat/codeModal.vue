<script lang="ts" setup>
import { ref } from 'vue'

// Если тема передается через props или берется из store:
withDefaults(
  defineProps<{
    currentTheme?: string
  }>(),
  {
    currentTheme: 'dark',
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div
    :data-editor-theme="currentTheme"
    class="fixed inset-0 z-50 flex items-center justify-center bg-(--editor-overlay-bg) p-4 backdrop-blur-(--editor-overlay-blur) md:p-10"
    @click.self="closeModal"
  >
    <div
      class="relative flex h-auto min-h-[220px] max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-(--editor-sheet-radius) border border-(--editor-border) bg-(--editor-sheet-bg) shadow-2xl transition-all duration-300"
    >
      <!-- Контент модального окна -->
      <slot />
    </div>
  </div>
</template>