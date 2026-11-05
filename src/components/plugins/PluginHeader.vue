<script setup lang="ts">
import { ArrowLeft, Search, Plus, Globe, HardDrive } from 'lucide-vue-next'

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const activeCategory = defineModel<string>('activeCategory', { default: 'all' })
const activeTab = defineModel<'market' | 'installed'>('activeTab', { default: 'market' })

defineProps<{
  categories: { id: string; label: string }[]
  installedCount: number
  serverCount: number
}>()

const emit = defineEmits<{
  (e: 'go-home'): void
  (e: 'open-upload'): void
}>()
</script>

<template>
  <header class="flex flex-col gap-6 mb-6">
   
    <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
      <div class="flex flex-col gap-2">
        <button 
          @click="emit('go-home')"
          class="w-fit flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Назад в чаты</span>
        </button>

        <div>
          
        </div>
      </div>
      
      <!-- Поиск и кнопка публикации -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <div class="relative flex-1 md:w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Найти плагин или тему..." 
            class="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400/50 transition-colors"
          />
        </div>

      
      </div>
    </div>

    <!-- Вкладки: Каталог сервера vs Установленные на ПК -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
      <div class="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/5">
        <button
          type="button"
          @click="activeTab = 'market'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
          :class="activeTab === 'market' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'"
        >
          <Globe class="w-3.5 h-3.5" />
          <span>Каталог</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{{ serverCount }}</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'installed'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
          :class="activeTab === 'installed' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'"
        >
          <HardDrive class="w-3.5 h-3.5" />
          <span>Установленные</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{{ installedCount }}</span>
        </button>
      </div>

      <!-- Категории -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="activeCategory = cat.id"
          class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border"
          :class="
            activeCategory === cat.id
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
          "
        >
          {{ cat.label }}
        </button>
      </div>
    </div>
  </header>
</template>
