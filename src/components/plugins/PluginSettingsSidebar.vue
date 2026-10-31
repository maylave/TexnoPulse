<script setup lang="ts">
import { computed } from 'vue'
import { X, Sparkles, Palette, FileCode, FileText, Bot, RefreshCw, Puzzle, Timer } from 'lucide-vue-next'
import UiToggle from '@/components/ui/UiToggle.vue'

const props = defineProps<{
  plugin: any | null
  isActive?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle', value: boolean): void
}>()

const iconComponent = computed(() => {
  const iconName = typeof props.plugin?.icon === 'string' ? props.plugin.icon.toLowerCase() : ''
  if (iconName.includes('sparkle')) return Sparkles
  if (iconName.includes('palette') || iconName.includes('theme')) return Palette
  if (iconName.includes('code') || iconName.includes('matrix')) return FileCode
  if (iconName.includes('text') || iconName.includes('note')) return FileText
  if (iconName.includes('clock') || iconName.includes('timer') || iconName.includes('pomo')) return Timer
  if (iconName.includes('bot') || iconName.includes('ai')) return Bot
  if (iconName.includes('sync')) return RefreshCw
  return Puzzle
})
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="plugin" 
      @click="emit('close')"
      class="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
    ></div>
  </Transition>

  <Transition name="slide-right">
    <div 
      v-if="plugin"
      class="absolute top-0 right-0 z-50 h-full w-full md:w-[420px] bg-[#0c101d] backdrop-blur-[24px] border-l border-white/10 shadow-2xl flex flex-col text-white"
    >
      <div class="flex items-center justify-between p-6 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <component :is="iconComponent" class="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 class="text-base font-bold text-white">{{ plugin.name }}</h2>
            <p class="text-xs text-slate-400">Настройки плагина</p>
          </div>
        </div>
        <button 
          @click="emit('close')"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
        <!-- Тумблер включения -->
        <div class="flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/10">
          <div>
            <div class="text-sm font-semibold text-white">Включить плагин</div>
            <div class="text-xs text-slate-400 mt-0.5">Активирует стили и функционал в приложении</div>
          </div>
          <UiToggle 
            :model-value="Boolean(isActive !== undefined ? isActive : plugin.isActive)" 
            @update:model-value="emit('toggle', $event)" 
          />
        </div>

        <!-- Информация о плагине -->
        <div class="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
          <div class="flex justify-between py-1 text-slate-400 border-b border-white/5">
            <span>Идентификатор</span>
            <span class="font-mono text-white">{{ plugin.id }}</span>
          </div>
          <div class="flex justify-between py-1 text-slate-400 border-b border-white/5">
            <span>Версия</span>
            <span class="font-mono text-white">v{{ plugin.version }}</span>
          </div>
          <div class="flex justify-between py-1 text-slate-400 border-b border-white/5">
            <span>Автор</span>
            <span class="text-white">{{ plugin.author || 'Сторонний автор' }}</span>
          </div>
          <div class="flex justify-between py-1 text-slate-400">
            <span>Категория</span>
            <span class="text-sky-400 capitalize">{{ plugin.categoryId || 'visual' }}</span>
          </div>
        </div>

        <!-- Описание -->
        <div class="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 leading-relaxed">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Описание</span>
          <p>{{ plugin.desc }}</p>
        </div>
      </div>

      <div class="p-6 border-t border-white/10 bg-white/[0.02]">
        <button 
          @click="emit('close')" 
          class="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer"
        >
          Готово
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
