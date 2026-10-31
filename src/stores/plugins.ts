// src/stores/plugins.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pluginsService, type ServerPluginManifest } from '@/api/services/plugins.service'
import { pluginRuntime, type InstalledPlugin } from '@/services/plugins/PluginRuntime'

const STORAGE_KEY = 'snapi_installed_plugins'

export const DEFAULT_STARTER_PLUGINS: ServerPluginManifest[] = [
  {
    id: 'action-card',
    name: 'Interactive Action Card',
    version: '1.0.0',
    desc: 'Демонстрационный плагин нового SDK: регистрирует интерактивный тип сообщений action-card, изолированное хранилище и всплывающие уведомления.',
    author: 'Snapi SDK Team',
    icon: 'FileCode',
    categoryId: 'utils',
    downloads: 120,
    rating: 5.0,
    hasTheme: false,
    styles: '',
    code: `
      export default {
        install(snapi) {
          console.log('[Plugin: Action Card] Инициализирован через Snapi SDK');

          const runCount = (snapi.storage.get('runCount', 0) || 0) + 1;
          snapi.storage.set('runCount', runCount);

          snapi.ui.showToast('Action Card активирован (запуск #' + runCount + ')', 'success');

          snapi.messages.registerBlock('action-card', {
            containerClass: 'w-full my-1',
            render(container, block) {
              const title = block.title || 'Новая задача';
              const status = block.status || 'В процессе';
              const priority = block.priority || 'Высокий';

              container.innerHTML = '<div class=\"p-3.5 rounded-xl bg-white/[0.04] border border-sky-500/30 backdrop-blur-md flex flex-col gap-2\">' +
                '<div class=\"flex items-center justify-between\">' +
                  '<span class=\"text-xs font-semibold text-sky-400\">⚡ Action Card</span>' +
                  '<span class=\"text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20\">' + priority + '</span>' +
                '</div>' +
                '<div class=\"text-sm font-medium text-white\">' + title + '</div>' +
                '<div class=\"flex items-center justify-between pt-2 border-t border-white/10 text-xs\">' +
                  '<span class=\"text-slate-400 text-[11px]\">Статус: <strong class=\"text-slate-200\">' + status + '</strong></span>' +
                  '<button class=\"snapi-act-complete px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-[11px] transition-colors cursor-pointer\">' +
                    'Завершить' +
                  '</button>' +
                '</div>' +
              '</div>';

              const btn = container.querySelector('.snapi-act-complete');
              const clickHandler = () => {
                snapi.ui.showToast('Задача \"' + title + '\" выполнена!', 'success');
                if (btn) {
                  btn.textContent = 'Готово ✓';
                  btn.style.background = '#22c55e';
                  btn.style.color = '#fff';
                }
              };
              btn && btn.addEventListener('click', clickHandler);

              return () => {
                btn && btn.removeEventListener('click', clickHandler);
              };
            }
          });

          this._widget = snapi.ui.addFloatingWidget({
            position: 'bottom-right',
            html: '<button id=\"snapi-action-demo-btn\" style=\"display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 9999px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.5);\">' +
              '<span>⚡</span>' +
              '<span>Action Card SDK</span>' +
            '</button>',
            onMount(el) {
              el.querySelector('#snapi-action-demo-btn')?.addEventListener('click', () => {
                snapi.ui.showToast('Новый тип сообщения \"action-card\" зарегистрирован и готов к рендеру', 'info');
              });
            }
          });
        },

        uninstall(snapi) {
          console.log('[Plugin: Action Card] Отключен');
          snapi.messages.unregisterBlock('action-card');
          if (this._widget) {
            this._widget.remove();
          }
          snapi.ui.showToast('Action Card деактивирован', 'info');
        }
      };
    `
  },
  {
    id: 'aurora-theme',
    name: 'Aurora Borealis Theme',
    version: '1.0.0',
    desc: 'Пример темы оформления на базе snapi.theme.setTokens: глубокие бирюзовые и изумрудные тона северного сияния.',
    author: 'Snapi SDK Team',
    icon: 'Palette',
    categoryId: 'visual',
    downloads: 95,
    rating: 4.9,
    hasTheme: true,
    styles: '',
    code: `
      export default {
        install(snapi) {
          snapi.theme.setTokens({
            '--color-background': '#040d12',
            '--sidebar-bg': '#07161e',
            '--color-surface': '#0b1d28',
            '--color-surface-container': '#0f2736',
            '--color-surface-container-high': '#14354a',
            '--color-accent': '#14b8a6',
            '--color-accent-hover': '#2dd4bf',
            '--color-primary': '#14b8a6',
            '--color-outline': '#14b8a6',
            '--liquid-glass-border': '1px solid rgba(20, 184, 166, 0.35)',
            '--liquid-glass-shadow': '0 0 25px rgba(20, 184, 166, 0.15)'
          });
          snapi.ui.showToast('Тема Aurora Borealis активирована', 'success');
        },
        uninstall(snapi) {
          snapi.theme.reset();
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
          // Исключаем старые удаленные плагины
          const deprecated = new Set(['cyberpunk-neon', 'matrix-effect', 'pomodoro-timer', 'quick-notes'])
          installedPlugins.value = parsed.filter(p => !deprecated.has(p.id))
          persistInstalledPlugins()
          console.log(`[Plugin Store] Загружено с ПК установленных плагинов: ${installedPlugins.value.length}`)
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
