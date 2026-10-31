// src/stores/plugins.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pluginsService, type ServerPluginManifest } from '@/api/services/plugins.service'
import { pluginRuntime, type InstalledPlugin } from '@/services/plugins/PluginRuntime'

const STORAGE_KEY = 'snapi_installed_plugins'

export const DEFAULT_STARTER_PLUGINS: ServerPluginManifest[] = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon Theme',
    version: '1.0.0',
    desc: 'Футуристическая неоновая киберпанк-тема с глубоким темным фоном, неоновым бирюзовым свечением и стилизованными эффектами чата.',
    author: 'Snapi Team',
    icon: 'Sparkles',
    categoryId: 'visual',
    downloads: 245,
    rating: 4.95,
    hasTheme: true,
    styles: `
      :root[data-plugin-theme="cyberpunk-neon"],
      body[data-plugin-theme="cyberpunk-neon"] {
        --sidebar-bg: #070914 !important;
        --color-background: #050811 !important;
        --color-surface: #080c1d !important;
        --color-surface-container: #0c122b !important;
        --color-surface-container-high: #121c40 !important;
        --color-surface-container-low: #050813 !important;
        --color-surface-container-lowest: #020409 !important;
        --color-accent: #00f2fe !important;
        --color-accent-hover: #4facfe !important;
        --color-primary: #00f2fe !important;
        --color-on-surface: #e0faff !important;
        --color-on-surface-variant: #7fe3f5 !important;
        --color-outline: #00f2fe !important;
        --color-outline-variant: rgba(0, 242, 254, 0.25) !important;
        --liquid-glass-bg: linear-gradient(135deg, rgba(8, 12, 29, 0.85) 0%, rgba(12, 18, 43, 0.75) 100%) !important;
        --liquid-glass-border: 1px solid rgba(0, 242, 254, 0.35) !important;
        --liquid-glass-shadow: 0 0 25px rgba(0, 242, 254, 0.18), inset 0 0 15px rgba(0, 242, 254, 0.08) !important;
        --message-content-bg: linear-gradient(135deg, rgba(12, 18, 43, 0.8) 0%, rgba(18, 28, 64, 0.85) 100%) !important;
      }
      [data-plugin-theme="cyberpunk-neon"] .liquid-glass {
        border: 1px solid rgba(0, 242, 254, 0.3) !important;
        box-shadow: 0 0 30px rgba(0, 242, 254, 0.12), inset 0 0 15px rgba(0, 242, 254, 0.05) !important;
      }
      [data-plugin-theme="cyberpunk-neon"] .glass-modal {
        border: 1px solid rgba(0, 242, 254, 0.4) !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.2) !important;
      }
    `,
    code: `
      export default {
        install(context) {
          console.log('[Plugin: Cyberpunk Neon] Активирован успешно!');
          context.showNotification('Cyberpunk Neon', 'Тема Cyberpunk Neon успешно активирована на вашем ПК!');
        },
        uninstall(context) {
          console.log('[Plugin: Cyberpunk Neon] Деактивирован.');
        }
      };
    `
  },
  {
    id: 'matrix-effect',
    name: 'Matrix Code Canvas',
    version: '1.1.0',
    desc: 'Зеленая терминальная тема в стиле Матрицы с изумрудным свечением акцентов и контуров.',
    author: 'HackerOne',
    icon: 'FileCode',
    categoryId: 'visual',
    downloads: 190,
    rating: 4.8,
    hasTheme: true,
    styles: `
      :root[data-plugin-theme="matrix-effect"],
      body[data-plugin-theme="matrix-effect"] {
        --sidebar-bg: #030d06 !important;
        --color-background: #020703 !important;
        --color-surface: #041208 !important;
        --color-surface-container: #061c0d !important;
        --color-surface-container-high: #0b2e17 !important;
        --color-surface-container-low: #020904 !important;
        --color-surface-container-lowest: #010402 !important;
        --color-accent: #00ff66 !important;
        --color-accent-hover: #33ff85 !important;
        --color-primary: #00ff66 !important;
        --color-on-surface: #dcffe7 !important;
        --color-on-surface-variant: #66ff99 !important;
        --color-outline: #00ff66 !important;
        --color-outline-variant: rgba(0, 255, 102, 0.25) !important;
        --liquid-glass-bg: linear-gradient(135deg, rgba(4, 18, 8, 0.85) 0%, rgba(6, 28, 13, 0.8) 100%) !important;
        --liquid-glass-border: 1px solid rgba(0, 255, 102, 0.3) !important;
        --liquid-glass-shadow: 0 0 25px rgba(0, 255, 102, 0.15) !important;
      }
      [data-plugin-theme="matrix-effect"] .liquid-glass {
        border: 1px solid rgba(0, 255, 102, 0.3) !important;
        box-shadow: 0 0 25px rgba(0, 255, 102, 0.15) !important;
      }
    `,
    code: `
      export default {
        install(context) {
          context.showNotification('Matrix Code', 'Тема Matrix Code подключена!');
        },
        uninstall(context) {
          console.log('[Plugin: Matrix Code] Отключен');
        }
      };
    `
  },
  {
    id: 'quick-notes',
    name: 'Quick Notes & Scratchpad',
    version: '1.0.2',
    desc: 'Встроенный блокнот для быстрых заметок, сниппетов кода и черновиков прямо внутри мессенджера.',
    author: 'DevAlex',
    icon: 'FileText',
    categoryId: 'utils',
    downloads: 315,
    rating: 4.9,
    hasTheme: false,
    styles: '',
    code: `
      export default {
        install(context) {
          console.log('[Plugin: Quick Notes] Инициализирован');
        },
        uninstall(context) {
          console.log('[Plugin: Quick Notes] Отключен');
        }
      };
    `
  }
]

export const usePluginStore = defineStore('plugins', () => {
  // Список плагинов на сервере (Каталог / Магазин)
  const serverPlugins = ref<ServerPluginManifest[]>([...DEFAULT_STARTER_PLUGINS])
  // Список плагинов, установленных локально на этот ПК
  const installedPlugins = ref<InstalledPlugin[]>([])

  const isLoading = ref(false)
  const isActionLoading = ref(false)
  const error = ref<string | null>(null)

  // Карта установленных плагинов по ID
  const installedMap = computed(() => {
    const map = new Map<string, InstalledPlugin>()
    for (const p of installedPlugins.value) {
      map.set(p.id, p)
    }
    return map
  })

  const isInstalled = (id: string): boolean => {
    return installedMap.value.has(id)
  }

  const isPluginActive = (id: string): boolean => {
    const plugin = installedMap.value.get(id)
    return Boolean(plugin && plugin.isActive)
  }

  /**
   * Загрузка установленных плагинов из постоянного локального хранилища ПК
   */
  const loadInstalledPlugins = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          installedPlugins.value = parsed
          console.log(`[Plugin Store] Загружено с ПК установленных плагинов: ${parsed.length}`)
          return
        }
      }
    } catch (e) {
      console.error('[Plugin Store] Ошибка чтения установленных плагинов:', e)
    }
    installedPlugins.value = []
  }

  /**
   * Сохранение установленных плагинов на ПК (localStorage)
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
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        serverPlugins.value = res.data.data
      }
    } catch (e: any) {
      console.warn('[Plugin Store] Сервер каталога недоступен, используем локальный кэш:', e)
      // Если сервер недоступен, сохраняем стартовые плагины
      if (serverPlugins.value.length === 0) {
        serverPlugins.value = [...DEFAULT_STARTER_PLUGINS]
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Скачать и установить плагин с сервера на ПК
   */
  const installPlugin = async (serverPlugin: ServerPluginManifest, activateNow = true) => {
    isActionLoading.value = true
    try {
      console.log(`[Plugin Store] Скачивание плагина ${serverPlugin.name} с сервера...`)
      
      let downloadData: any = {
        code: serverPlugin.code || '',
        styles: serverPlugin.styles || ''
      }

      try {
        const res = await pluginsService.download(serverPlugin.id)
        if (res.data) {
          downloadData = res.data
        }
      } catch {
        console.warn(`[Plugin Store] Скачивание с сервера не удалось, устанавливаем из манифеста...`)
      }

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
        isActive: activateNow,
        installedAt: new Date().toISOString()
      }

      // Если это тема, отключаем другие активные темы
      if (activateNow && installed.categoryId === 'visual') {
        for (const p of installedPlugins.value) {
          if (p.id !== installed.id && p.categoryId === 'visual' && p.isActive) {
            p.isActive = false
            await pluginRuntime.deactivate(p)
          }
        }
      }

      // Обновляем или добавляем в список установленных
      const existingIdx = installedPlugins.value.findIndex(p => p.id === installed.id)
      if (existingIdx >= 0) {
        installedPlugins.value[existingIdx] = installed
      } else {
        installedPlugins.value.push(installed)
      }

      installedPlugins.value = [...installedPlugins.value]
      persistInstalledPlugins()

      if (activateNow) {
        await pluginRuntime.activate(installed)
      }

      const serverEntry = serverPlugins.value.find(p => p.id === serverPlugin.id)
      if (serverEntry) {
        serverEntry.downloads = (serverEntry.downloads || 0) + 1
      }

      console.log(`[Plugin Store] Плагин ${installed.name} успешно установлен на ПК!`)
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
    console.log(`[Plugin Store] Переключение плагина ${pluginId} -> ${status}`)
    let plugin = installedPlugins.value.find(p => p.id === pluginId)

    if (!plugin) {
      // Если плагин еще не установлен на ПК, скачиваем и устанавливаем его
      const sPlugin = serverPlugins.value.find(p => p.id === pluginId)
      if (sPlugin) {
        await installPlugin(sPlugin, status)
      }
      return
    }

    // Если включаем визуальную тему, отключаем другие визуальные темы
    if (status && plugin.categoryId === 'visual') {
      for (const p of installedPlugins.value) {
        if (p.id !== plugin.id && p.categoryId === 'visual' && p.isActive) {
          p.isActive = false
          await pluginRuntime.deactivate(p)
        }
      }
    }

    plugin.isActive = status
    installedPlugins.value = [...installedPlugins.value]
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
  const publishPlugin = async (manifest: Partial<ServerPluginManifest>) => {
    isActionLoading.value = true
    try {
      const res = await pluginsService.upload(manifest)
      await fetchPlugins()
      return res.data
    } catch (e: any) {
      console.error('[Plugin Store] Ошибка публикации плагина:', e)
      throw e
    } finally {
      isActionLoading.value = false
    }
  }

  /**
   * Инициализация при старте приложения (восстановление активных плагинов и тем)
   */
  const init = async () => {
    loadInstalledPlugins()

    // 1. Немедленно активируем все плагины, которые включены на ПК
    for (const plugin of installedPlugins.value) {
      if (plugin.isActive) {
        try {
          await pluginRuntime.activate(plugin)
        } catch (err) {
          console.warn(`[Plugin Store] Ошибка активации плагина ${plugin.name}:`, err)
        }
      }
    }

    // 2. Фоново обновляем каталог с сервера
    fetchPlugins().catch(() => {})
  }

  return {
    serverPlugins,
    installedPlugins,
    isLoading,
    isActionLoading,
    error,
    isInstalled,
    isPluginActive,
    fetchPlugins,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
    publishPlugin,
    init
  }
})
