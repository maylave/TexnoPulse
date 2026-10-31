// src/stores/plugins.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pluginsService, type ServerPluginManifest } from '@/api/services/plugins.service'
import { pluginRuntime, type InstalledPlugin } from '@/services/plugins/PluginRuntime'

const STORAGE_KEY = 'snapi_installed_plugins'

export const usePluginStore = defineStore('plugins', () => {
  // Список плагинов на сервере (Каталог / Магазин)
  const serverPlugins = ref<ServerPluginManifest[]>([])
  // Список плагинов, установленных локально на этот ПК
  const installedPlugins = ref<InstalledPlugin[]>([])

  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const error = ref<string | null>(null)

  // Карта установленных плагинов для быстрого поиска
  const installedMap = computed(() => {
    const map = new Map<string, InstalledPlugin>()
    for (const p of installedPlugins.value) {
      map.set(p.id, p)
    }
    return map
  })

  const isInstalled = (id: string) => installedMap.value.has(id)

  const isPluginActive = (id: string) => {
    return installedMap.value.get(id)?.isActive ?? false
  }

  /**
   * Загрузка установленных плагинов из локального хранилища ПК
   */
  const loadInstalledPlugins = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        installedPlugins.value = JSON.parse(raw)
      }
    } catch (e) {
      console.error('[Plugin Store] Ошибка чтения установленных плагинов:', e)
      installedPlugins.value = []
    }
  }

  /**
   * Сохранение установленных плагинов на диск ПК (localStorage)
   */
  const persistInstalledPlugins = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(installedPlugins.value))
    } catch (e) {
      console.error('[Plugin Store] Ошибка сохранения плагинов на ПК:', e)
    }
  }

  /**
   * Загрузить каталог плагинов с сервера
   */
  const fetchPlugins = async () => {
    isLoading.value = true
    error.value = null
    try {
      const res = await pluginsService.getAll()
      serverPlugins.value = res.data?.data || []
    } catch (e: any) {
      console.error('[Plugin Store] Ошибка загрузки каталога с сервера:', e)
      error.value = 'Сервер временно недоступен или не удалось загрузить каталог плагинов'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Скачать и установить плагин с сервера на ПК
   */
  const installPlugin = async (serverPlugin: ServerPluginManifest) => {
    isActionLoading.value = true
    try {
      console.log(`[Plugin Store] Скачивание плагина с сервера: ${serverPlugin.name} (${serverPlugin.id})...`)
      const res = await pluginsService.download(serverPlugin.id)
      const downloadData = res.data

      const installed: InstalledPlugin = {
        id: serverPlugin.id,
        name: serverPlugin.name,
        version: serverPlugin.version,
        desc: serverPlugin.desc,
        author: serverPlugin.author,
        icon: serverPlugin.icon,
        categoryId: serverPlugin.categoryId,
        hasTheme: Boolean(serverPlugin.hasTheme || downloadData.styles),
        styles: downloadData.styles || serverPlugin.styles || '',
        code: downloadData.code || serverPlugin.code || '',
        isActive: true,
        installedAt: new Date().toISOString()
      }

      // Удаляем старую версию, если была
      installedPlugins.value = installedPlugins.value.filter(p => p.id !== installed.id)
      installedPlugins.value.push(installed)
      persistInstalledPlugins()

      // Активируем рантайм плагина (тему и скрипт)
      await pluginRuntime.activate(installed)

      // Обновляем количество скачиваний в серверном каталоге
      const serverEntry = serverPlugins.value.find(p => p.id === serverPlugin.id)
      if (serverEntry) {
        serverEntry.downloads = (serverEntry.downloads || 0) + 1
      }

      console.log(`[Plugin Store] Плагин ${installed.name} успешно установлен на ПК и активирован!`)
      return true
    } catch (e: any) {
      console.error('[Plugin Store] Ошибка при установке плагина:', e)
      error.value = `Не удалось установить плагин: ${e?.message || 'ошибка сети'}`
      return false
    } finally {
      isActionLoading.value = false
    }
  }

  /**
   * Удалить плагин с ПК
   */
  const uninstallPlugin = async (pluginId: string) => {
    const existing = installedPlugins.value.find(p => p.id === pluginId)
    if (existing) {
      await pluginRuntime.deactivate(existing)
      installedPlugins.value = installedPlugins.value.filter(p => p.id !== pluginId)
      persistInstalledPlugins()
      console.log(`[Plugin Store] Плагин ${pluginId} удален с ПК.`)
    }
  }

  /**
   * Включить или выключить установленный плагин на ПК
   */
  const togglePlugin = async (pluginId: string, status: boolean) => {
    const plugin = installedPlugins.value.find(p => p.id === pluginId)
    if (!plugin) {
      // Если плагин еще не установлен, но есть в серверном каталоге — сначала скачиваем его
      const sPlugin = serverPlugins.value.find(p => p.id === pluginId)
      if (sPlugin && status) {
        await installPlugin(sPlugin)
      }
      return
    }

    plugin.isActive = status
    persistInstalledPlugins()

    if (status) {
      await pluginRuntime.activate(plugin)
    } else {
      await pluginRuntime.deactivate(plugin)
    }
  }

  /**
   * Опубликовать сторонний плагин на сервер
   */
  const uploadPlugin = async (pluginData: Partial<ServerPluginManifest>) => {
    isActionLoading.value = true
    try {
      const res = await pluginsService.upload(pluginData)
      await fetchPlugins()
      return res.data
    } catch (e: any) {
      console.error('[Plugin Store] Ошибка публикации стороннего плагина:', e)
      throw e
    } finally {
      isActionLoading.value = false
    }
  }

  /**
   * Инициализация при старте приложения
   */
  const init = async () => {
    loadInstalledPlugins()
    // Запускаем все активные плагины
    for (const plugin of installedPlugins.value) {
      if (plugin.isActive) {
        pluginRuntime.activate(plugin).catch(err => {
          console.warn(`[Plugin Store] Ошибка активации плагина ${plugin.name}:`, err)
        })
      }
    }
    // Фоново подтягиваем каталог сервера
    fetchPlugins().catch(() => {})
  }

  return {
    serverPlugins,
    installedPlugins,
    installedMap,
    isLoading,
    isActionLoading,
    error,
    isInstalled,
    isPluginActive,
    fetchPlugins,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
    uploadPlugin,
    init
  }
})
