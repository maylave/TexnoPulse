<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Puzzle, Loader2 } from 'lucide-vue-next'

import PluginHeader from '@/components/plugins/PluginHeader.vue'
import PluginCard from '@/components/plugins/PluginCard.vue'
import PluginSettingsSidebar from '@/components/plugins/PluginSettingsSidebar.vue'
import { usePluginStore } from '@/stores/plugins' // Импорт стора

const router = useRouter()
const pluginStore = usePluginStore()

// Извлекаем реактивные состояния из стора
const { plugins, isLoading } = storeToRefs(pluginStore)

const searchQuery = ref('')
const activeCategory = ref('all')
const selectedPlugin = ref<any>(null)

const categories = [
  { id: 'all', label: 'Все плагины' },
  { id: 'visual', label: 'Визуализация' },
  { id: 'ai', label: 'Нейросети' },
  { id: 'sync', label: 'Синхронизация' },
  { id: 'utils', label: 'Утилиты' }
]

onMounted(() => {
  pluginStore.fetchPlugins()
})

const filteredPlugins = computed(() => {
  return plugins.value.filter(plugin => {
    const matchCategory = activeCategory.value === 'all' || plugin.categoryId === activeCategory.value
    const query = searchQuery.value.toLowerCase()
    const matchSearch = plugin.name.toLowerCase().includes(query) || plugin.desc.toLowerCase().includes(query)
    return matchCategory && matchSearch
  })
})
</script>

<template>
  <!-- Шаблон остается без изменений, за исключением того, что 
       вместо togglePluginStatus теперь используем pluginStore.togglePlugin -->
  
  <div class="relative h-screen w-full bg-background text-on-surface overflow-hidden">
    <div class="h-full w-full p-6 md:p-10 overflow-y-auto">
      
      <PluginHeader 
        v-model:search-query="searchQuery"
        v-model:active-category="activeCategory"
        :categories="categories"
        @go-home="router.push('/')"
      />

      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 class="w-10 h-10 text-accent animate-spin mb-4" />
        <p class="text-sm text-on-surface-variant">Загрузка плагинов...</p>
      </div>

      <div v-else-if="filteredPlugins.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <Puzzle class="w-12 h-12 text-on-surface-variant/30 mb-4" />
        <h3 class="text-lg font-medium text-white mb-2">Ничего не найдено</h3>
        <p class="text-sm text-on-surface-variant">Попробуйте изменить запрос или выбрать другую категорию.</p>
      </div>

      <TransitionGroup 
        v-else
        tag="div" 
        appear
        name="stagger-card"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <PluginCard 
          v-for="(plugin, index) in filteredPlugins" 
          :key="plugin.id"
          :plugin="plugin"
          :style="{ transitionDelay: `${index * 40}ms` }"
          @open-settings="selectedPlugin = $event"
          @toggle="pluginStore.togglePlugin(plugin.id, $event)" 
        />
      </TransitionGroup>
    </div>

    <PluginSettingsSidebar 
      :plugin="selectedPlugin"
      @close="selectedPlugin = null"
      @toggle="selectedPlugin ? pluginStore.togglePlugin(selectedPlugin.id, $event) : null"
    />
  </div>
</template>