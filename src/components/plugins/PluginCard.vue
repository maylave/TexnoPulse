<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
import UiToggle from '@/components/ui/UiToggle.vue'

const props = defineProps<{
  plugin: any
}>()

const emit = defineEmits<{
  (e: 'open-settings', plugin: any): void
  (e: 'toggle', value: boolean): void
}>()
</script>

<template>
  <div class="group/card relative flex flex-col p-5 rounded-2xl glass-modal transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-white/20">
    <div class="flex justify-between items-start mb-4 relative z-10">
      <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center border border-[var(--glass-border)] transition-transform duration-300 ease-out group-hover/card:scale-105 group-hover/card:bg-surface-container-high">
        <component :is="plugin.icon" class="w-6 h-6 text-accent drop-shadow-[0_0_8px_rgba(78,168,255,0.4)] transition-transform duration-300 group-hover/card:rotate-6" />
      </div>
      
      <!-- Пробрасываем событие обновления наверх -->
      <UiToggle 
        :model-value="plugin.isActive" 
        @update:model-value="emit('toggle', $event)" 
      />
    </div>

    <div class="relative z-10 flex-grow">
      <h3 class="text-base font-semibold text-white/90 mb-1.5 transition-colors group-hover/card:text-white">{{ plugin.name }}</h3>
      <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
        {{ plugin.desc }}
      </p>
    </div>

    <div class="relative z-10 mt-5 pt-4 border-t border-[var(--glass-border)] flex justify-between items-center">
      <span class="text-[10px] font-medium uppercase tracking-wider transition-colors duration-300" :class="plugin.isActive ? 'text-accent/80' : 'text-on-surface-variant/60'">
        {{ plugin.isActive ? 'Активен' : 'Отключен' }}
      </span>
      <button 
        @click="emit('open-settings', plugin)"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors active:scale-95 focus:outline-none"
      >
        <Settings class="w-4 h-4 transition-transform duration-500 ease-out group-hover/card:rotate-45" />
      </button>
    </div>
  </div>
</template>