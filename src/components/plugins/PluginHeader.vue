<script setup lang="ts">
import { ArrowLeft, Search } from 'lucide-vue-next'

// Используем новые макросы Vue 3.4+ для двустороннего связывания
const searchQuery = defineModel<string>('searchQuery', { default: '' })
const activeCategory = defineModel<string>('activeCategory', { default: 'all' })

defineProps<{
  categories: { id: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'go-home'): void
}>()
</script>

<template>
  <header class="flex flex-col gap-6 mb-8">
    <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
      <div class="flex flex-col gap-3">
        <button 
          @click="emit('go-home')"
          class="w-fit flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>На главную</span>
        </button>

        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white mb-1">Маркетплейс</h1>
          <p class="text-on-surface-variant text-sm">Управление расширениями и интеграциями.</p>
        </div>
      </div>
      
      <div class="relative w-full md:w-80">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Найти плагин..." 
          class="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-on-surface placeholder-[var(--input-placeholder)] focus:outline-none focus:border-accent transition-colors shadow-[var(--input-shadow)]"
        >
      </div>
    </div>

    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="activeCategory = cat.id"
        class="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out active:scale-95 border"
        :class="
          activeCategory === cat.id
            ? 'bg-accent/20 text-accent border-accent/30 shadow-[inset_0_0_12px_rgba(78,168,255,0.1)]'
            : 'bg-[var(--input-bg)] text-on-surface-variant border-[var(--glass-border)] hover:text-white hover:bg-white/5'
        "
      >
        {{ cat.label }}
      </button>
    </div>
  </header>
</template>