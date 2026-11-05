<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// import { storeToRefs } from 'pinia' // Закомментировано
import { Puzzle, Loader2, Sparkles, AlertCircle } from 'lucide-vue-next'

import PluginHeader from '@/components/plugins/PluginHeader.vue'
import PluginCard from '@/components/plugins/PluginCard.vue'
import PluginSettingsSidebar from '@/components/plugins/PluginSettingsSidebar.vue'
import PluginUploadModal from '@/components/plugins/PluginUploadModal.vue'

const router = useRouter()

// Локальные состояния-заглушки вместо стора
const serverPlugins = ref<any[]>([])
const installedPlugins = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const activeCategory = ref('all')
const activeTab = ref<'market' | 'installed'>('market')
const selectedPlugin = ref<any>(null)
const isUploadModalOpen = ref(false)
const installingId = ref<string | null>(null)

const categories = [
  { id: 'all', label: 'Все плагины' },
  { id: 'visual', label: 'Темы и стиль' },
  { id: 'ai', label: 'Нейросети' },
  { id: 'utils', label: 'Утилиты' },
  { id: 'sync', label: 'Синхронизация' }
]

onMounted(() => {
  // pluginStore.init()
})

// Список плагинов в зависимости от выбранной вкладки (Серверный каталог или Установленные)
const currentList = computed(() => {
  if (activeTab.value === 'installed') {
    return installedPlugins.value
  }
  return serverPlugins.value
})

const filteredPlugins = computed(() => {
  return currentList.value.filter(plugin => {
    const matchCategory = activeCategory.value === 'all' || plugin.categoryId === activeCategory.value
    const query = searchQuery.value.toLowerCase()
    const matchSearch =
      (plugin.name || '').toLowerCase().includes(query) ||
      (plugin.desc || '').toLowerCase().includes(query) ||
      (plugin.author || '').toLowerCase().includes(query)
    return matchCategory && matchSearch
  })
})

// --- Заглушки методов вместо pluginStore ---

const fetchPlugins = () => {
  // Логика повторной загрузки (pluginStore.fetchPlugins)
  isLoading.value = true
  setTimeout(() => isLoading.value = false, 1000)
}

const isInstalled = (pluginId: string) => {
  // return pluginStore.isInstalled(pluginId)
  return installedPlugins.value.some(p => p.id === pluginId)
}

const isPluginActive = (pluginId: string) => {
  // return pluginStore.isPluginActive(pluginId)
  const plugin = installedPlugins.value.find(p => p.id === pluginId)
  return plugin ? plugin.isActive : false
}

const handleInstall = async (plugin: any) => {
  installingId.value = plugin.id
  try {
    // await pluginStore.installPlugin(plugin)
    // Эмуляция установки
    await new Promise(res => setTimeout(res, 500))
    installedPlugins.value.push({ ...plugin, isActive: false })
  } finally {
    installingId.value = null
  }
}

const handleUninstall = async (pluginId: string) => {
  // await pluginStore.uninstallPlugin(pluginId)
  installedPlugins.value = installedPlugins.value.filter(p => p.id !== pluginId)
  
  if (selectedPlugin.value?.id === pluginId) {
    selectedPlugin.value = null
  }
}

const handleToggle = async (pluginId: string, value: boolean) => {
  // await pluginStore.togglePlugin(pluginId, value)
  const p = installedPlugins.value.find(p => p.id === pluginId)
  if (p) {
    p.isActive = value
  }

  // Обновляем выбранный в сайдбаре плагин
  if (selectedPlugin.value?.id === pluginId) {
    selectedPlugin.value.isActive = value
  }
}
</script>

<template>
  <div class="relative h-screen w-full bg-[#0b0f19] text-white overflow-hidden font-sans">
    <!-- Фоновые мягкие неоновые сферы -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-32 -left-32 size-96 rounded-full bg-sky-500/10 blur-[120px]"></div>
      <div class="absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-500/10 blur-[120px]"></div>
    </div>

    <div class="relative z-10 h-full w-full p-6 md:p-10 overflow-y-auto">
      <PluginHeader 
        v-model:search-query="searchQuery"
        v-model:active-category="activeCategory"
        v-model:active-tab="activeTab"
        :categories="categories"
        :installed-count="installedPlugins.length"
        :server-count="serverPlugins.length"
        @go-home="router.push('/home')"
        @open-upload="isUploadModalOpen = true"
      />

      <!-- Ошибка загрузки -->
      <div v-if="error" class="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ error }}</span>
        <button 
          @click="fetchPlugins" 
          class="ml-auto underline font-medium hover:text-white cursor-pointer"
        >
          Повторить
        </button>
      </div>

      <!-- Загрузка -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 class="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p class="text-xs text-slate-400">Синхронизация каталога плагинов с сервером...</p>
      </div>

      <!-- Пустое состояние -->
      <div v-else-if="filteredPlugins.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
        <Puzzle class="w-12 h-12 text-slate-600 mb-3" />
        <h3 class="text-base font-semibold text-white mb-1">
          {{ activeTab === 'installed' ? 'Нет установленных плагинов' : 'Плагины не найдены' }}
        </h3>
        <p class="text-xs text-slate-400 max-w-sm mb-4">
          {{ activeTab === 'installed' 
            ? 'Перейдите во вкладку «Каталог на сервере», чтобы скачать темы и расширения на этот компьютер.' 
            : 'Попробуйте изменить поисковый запрос или опубликуйте свой сторонний плагин.' }}
        </p>
        <button
          v-if="activeTab === 'installed'"
          @click="activeTab = 'market'"
          class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-colors cursor-pointer"
        >
          Перейти в каталог на сервере
        </button>
      </div>

      <!-- Сетка карточек плагинов -->
      <TransitionGroup 
        v-else
        tag="div" 
        appear
        name="stagger-card"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12"
      >
        <PluginCard 
          v-for="plugin in filteredPlugins" 
          :key="plugin.id"
          :plugin="plugin"
          :is-installed="isInstalled(plugin.id)"
          :is-active="isPluginActive(plugin.id)"
          :is-installing="installingId === plugin.id"
          @open-settings="selectedPlugin = $event"
          @install="handleInstall($event)"
          @uninstall="handleUninstall($event)"
          @toggle="handleToggle(plugin.id, $event)" 
        />
      </TransitionGroup>
    </div>

    <!-- Сайдбар настроек выбранного плагина -->
    <PluginSettingsSidebar 
      :plugin="selectedPlugin"
      :is-active="selectedPlugin ? isPluginActive(selectedPlugin.id) : false"
      @close="selectedPlugin = null"
      @toggle="selectedPlugin ? handleToggle(selectedPlugin.id, $event) : null"
    />

    <!-- Модальное окно загрузки стороннего плагина -->
    <PluginUploadModal 
      v-if="isUploadModalOpen"
      @close="isUploadModalOpen = false"
      @published="activeTab = 'market'"
    />
  </div>
</template>

<style scoped>
.stagger-card-enter-active,
.stagger-card-leave-active {
  transition: all 0.3s ease;
}
.stagger-card-enter-from,
.stagger-card-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
</style>