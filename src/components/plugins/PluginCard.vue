<script setup lang="ts">
import { computed } from 'vue'
import {
  Settings,
  Download,
  CheckCircle2,
  Trash2,
  Sparkles,
  Palette,
  FileCode,
  FileText,
  Bot,
  RefreshCw,
  Puzzle,
  Loader2,
  Layers
} from 'lucide-vue-next'
import UiToggle from '@/components/ui/UiToggle.vue'

const props = defineProps<{
  plugin: any
  isInstalled: boolean
  isInstalling?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-settings', plugin: any): void
  (e: 'toggle', value: boolean): void
  (e: 'install', plugin: any): void
  (e: 'uninstall', pluginId: string): void
}>()

// Маппинг строковых имен иконок в Lucide компоненты
const iconComponent = computed(() => {
  const iconName = typeof props.plugin.icon === 'string' ? props.plugin.icon.toLowerCase() : ''
  if (iconName.includes('sparkle')) return Sparkles
  if (iconName.includes('palette') || iconName.includes('theme') || iconName.includes('paint')) return Palette
  if (iconName.includes('code') || iconName.includes('matrix')) return FileCode
  if (iconName.includes('text') || iconName.includes('note')) return FileText
  if (iconName.includes('bot') || iconName.includes('ai')) return Bot
  if (iconName.includes('sync')) return RefreshCw
  if (iconName.includes('layer')) return Layers
  return Puzzle
})

const categoryLabel = computed(() => {
  switch (props.plugin.categoryId) {
    case 'visual': return 'Тема / Стиль'
    case 'ai': return 'Нейросети'
    case 'sync': return 'Синхронизация'
    case 'utils': return 'Утилиты'
    default: return 'Расширение'
  }
})
</script>

<template>
  <div 
    class="group/card relative flex flex-col p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:border-white/20"
  >
    <!-- Верхняя плашка с иконкой и статусом -->
    <div class="flex justify-between items-start mb-4 relative z-10">
      <div 
        class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 transition-transform duration-300 group-hover/card:scale-105"
      >
        <component 
          :is="iconComponent" 
          class="w-6 h-6 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)] transition-transform duration-300 group-hover/card:rotate-6" 
        />
      </div>

      <!-- Если установлен: переключатель Вкл/Выкл -->
      <div v-if="isInstalled" class="flex items-center gap-1.5">
        <UiToggle 
          :model-value="plugin.isActive" 
          @update:model-value="emit('toggle', $event)" 
        />
      </div>

      <!-- Если не установлен: бейджик "Доступен в каталоге" -->
      <div v-else class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
        <Download class="w-3 h-3" />
        <span>Каталог</span>
      </div>
    </div>

    <!-- Название, версия и описание -->
    <div class="relative z-10 flex-grow">
      <div class="flex items-center gap-2 mb-1">
        <h3 class="text-sm font-semibold text-white/90 transition-colors group-hover/card:text-white">
          {{ plugin.name }}
        </h3>
        <span class="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
          v{{ plugin.version }}
        </span>
      </div>

      <p class="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
        {{ plugin.desc }}
      </p>
    </div>

    <!-- Метаданные автора и категории -->
    <div class="relative z-10 flex items-center gap-2 text-[11px] text-slate-400 mb-4">
      <span class="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300">
        {{ categoryLabel }}
      </span>
      <span>•</span>
      <span class="truncate max-w-[120px]" :title="plugin.author">от {{ plugin.author || 'Автор' }}</span>
    </div>

    <!-- Нижняя панель действий -->
    <div class="relative z-10 pt-3 border-t border-white/10 flex justify-between items-center">
      <!-- Если установлен -->
      <template v-if="isInstalled">
        <div class="flex items-center gap-1.5 text-[11px] font-medium" :class="plugin.isActive ? 'text-emerald-400' : 'text-slate-400'">
          <CheckCircle2 class="w-3.5 h-3.5" />
          <span>{{ plugin.isActive ? 'Активен на ПК' : 'Отключен' }}</span>
        </div>

        <div class="flex items-center gap-1">
          <button 
            @click="emit('open-settings', plugin)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
            title="Настройки плагина"
          >
            <Settings class="w-3.5 h-3.5" />
          </button>

          <button 
            @click="emit('uninstall', plugin.id)"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors active:scale-95 cursor-pointer"
            title="Удалить с этого ПК"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </template>

      <!-- Если еще не установлен: кнопка скачивания -->
      <template v-else>
        <span class="text-[11px] text-slate-400 font-mono">
          {{ plugin.downloads || 0 }} загрузок
        </span>

        <button 
          @click="emit('install', plugin)"
          :disabled="isInstalling"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-medium shadow-md shadow-sky-500/20 transition-all hover:scale-102 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Loader2 v-if="isInstalling" class="w-3.5 h-3.5 animate-spin" />
          <Download v-else class="w-3.5 h-3.5" />
          <span>Установить на ПК</span>
        </button>
      </template>
    </div>
  </div>
</template>
