<script setup lang="ts">
import { X } from 'lucide-vue-next'
import UiToggle from '@/components/ui/UiToggle.vue'

defineProps<{
  plugin: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle', value: boolean): void
}>()
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="plugin" 
      @click="emit('close')"
      class="absolute inset-0 z-40 bg-[var(--bg-modal-overlay)] backdrop-blur-sm"
    ></div>
  </Transition>

  <Transition name="slide-right">
    <div 
      v-if="plugin"
      class="absolute top-0 right-0 z-50 h-full w-full md:w-[400px] bg-[var(--editor-sheet-bg)] backdrop-blur-[24px] border-l border-[var(--glass-border)] shadow-2xl flex flex-col"
    >
      <div class="flex items-center justify-between p-6 border-b border-[var(--glass-border)]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center border border-[var(--glass-border)]">
            <component :is="plugin.icon" class="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-white">{{ plugin.name }}</h2>
            <p class="text-xs text-on-surface-variant">Настройки плагина</p>
          </div>
        </div>
        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors active:scale-95"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
        <div class="flex items-center justify-between bg-surface-container/50 p-4 rounded-xl border border-[var(--glass-border)]">
          <div>
            <div class="text-sm font-medium text-white">Включить плагин</div>
            <div class="text-xs text-on-surface-variant mt-0.5">Активирует функционал в приложении</div>
          </div>
          <UiToggle 
            :model-value="plugin.isActive" 
            @update:model-value="emit('toggle', $event)" 
          />
        </div>
      </div>

      <div class="p-6 border-t border-[var(--glass-border)] bg-surface-container-lowest/30">
        <button @click="emit('close')" class="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors shadow-[0_0_12px_rgba(78,168,255,0.3)] active:scale-95">
          Сохранить и закрыть
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>