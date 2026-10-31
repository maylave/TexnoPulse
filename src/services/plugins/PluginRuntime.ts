// src/services/plugins/PluginRuntime.ts

export interface PluginContext {
  pluginId: string
  name: string
  version: string
  showNotification: (title: string, body: string) => void
  setThemeVariables: (vars: Record<string, string>) => void
  addStyle: (cssText: string) => void
  removeStyle: () => void
  on: (event: string, handler: (...args: any[]) => void) => void
  emit: (event: string, ...args: any[]) => void
}

export interface InstalledPlugin {
  id: string
  name: string
  version: string
  desc: string
  author: string
  icon: string
  categoryId: 'visual' | 'ai' | 'sync' | 'utils'
  hasTheme: boolean
  styles?: string
  code?: string
  isActive: boolean
  installedAt: string
}

class PluginRuntimeManager {
  private activeStyles = new Map<string, HTMLStyleElement>()
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>()
  private activeInstances = new Map<string, { uninstall?: (ctx: PluginContext) => void }>()

  /**
   * Применить CSS стили плагина (тему)
   */
  applyStyles(pluginId: string, styles: string) {
    this.removeStyles(pluginId)
    if (!styles || !styles.trim()) return

    const styleEl = document.createElement('style')
    styleEl.id = `snapi-plugin-theme-${pluginId}`
    styleEl.setAttribute('data-plugin-id', pluginId)
    styleEl.textContent = styles
    document.head.appendChild(styleEl)
    this.activeStyles.set(pluginId, styleEl)

    // Устанавливаем атрибут темы на корень документа
    document.documentElement.setAttribute('data-plugin-theme', pluginId)
    document.body.setAttribute('data-plugin-theme', pluginId)
  }

  /**
   * Удалить стили темы плагина
   */
  removeStyles(pluginId: string) {
    const existing = this.activeStyles.get(pluginId) || document.getElementById(`snapi-plugin-theme-${pluginId}`)
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing)
    }
    this.activeStyles.delete(pluginId)

    if (document.documentElement.getAttribute('data-plugin-theme') === pluginId) {
      document.documentElement.removeAttribute('data-plugin-theme')
    }
    if (document.body.getAttribute('data-plugin-theme') === pluginId) {
      document.body.removeAttribute('data-plugin-theme')
    }
  }

  /**
   * Создать контекст API для плагина
   */
  createContext(plugin: InstalledPlugin): PluginContext {
    return {
      pluginId: plugin.id,
      name: plugin.name,
      version: plugin.version,
      showNotification: (title: string, body: string) => {
        console.log(`[Plugin Notification: ${plugin.name}] ${title}: ${body}`)
        // Если доступен системный Notification или в приложении
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification(title, { body }) } catch {}
        }
      },
      setThemeVariables: (vars: Record<string, string>) => {
        for (const [key, val] of Object.entries(vars)) {
          const varName = key.startsWith('--') ? key : `--${key}`
          document.documentElement.style.setProperty(varName, val)
        }
      },
      addStyle: (cssText: string) => {
        this.applyStyles(plugin.id, cssText)
      },
      removeStyle: () => {
        this.removeStyles(plugin.id)
      },
      on: (event: string, handler: (...args: any[]) => void) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)!.add(handler)
      },
      emit: (event: string, ...args: any[]) => {
        const listeners = this.eventListeners.get(event)
        if (listeners) {
          for (const l of listeners) {
            try { l(...args) } catch (err) { console.error(`[Plugin Event Error]`, err) }
          }
        }
      }
    }
  }

  /**
   * Запустить плагин (применить тему и выполнить скрипт)
   */
  async activate(plugin: InstalledPlugin) {
    console.log(`[PluginRuntime] Активация плагина: ${plugin.name} (${plugin.id})...`)

    // 1. Применяем стили/тему, если есть
    if (plugin.styles) {
      this.applyStyles(plugin.id, plugin.styles)
    }

    // 2. Выполняем JS логику плагина
    if (plugin.code && plugin.code.trim()) {
      try {
        const context = this.createContext(plugin)
        let pluginModule: any = null

        // Преобразуем код плагина в исполняемый модуль
        // Поддержка экспорта export default { install, uninstall }
        const cleanCode = plugin.code.replace(/export\s+default\s+/, 'return ')
        try {
          const factory = new Function('context', `
            "use strict";
            ${cleanCode}
          `)
          pluginModule = factory(context)
        } catch {
          // Fallback: выполнение как прямого скрипта
          const directFactory = new Function('context', plugin.code)
          directFactory(context)
        }

        if (pluginModule && typeof pluginModule.install === 'function') {
          pluginModule.install(context)
          this.activeInstances.set(plugin.id, pluginModule)
        }
      } catch (err) {
        console.error(`[PluginRuntime] Ошибка при исполнении плагина ${plugin.name}:`, err)
      }
    }
  }

  /**
   * Отключить плагин
   */
  async deactivate(plugin: InstalledPlugin) {
    console.log(`[PluginRuntime] Деактивация плагина: ${plugin.name} (${plugin.id})...`)

    // 1. Вызываем хук uninstall
    const instance = this.activeInstances.get(plugin.id)
    if (instance && typeof instance.uninstall === 'function') {
      try {
        const context = this.createContext(plugin)
        instance.uninstall(context)
      } catch (err) {
        console.error(`[PluginRuntime] Ошибка при деактивации плагина ${plugin.name}:`, err)
      }
    }
    this.activeInstances.delete(plugin.id)

    // 2. Снимаем стили темы
    this.removeStyles(plugin.id)
  }
}

export const pluginRuntime = new PluginRuntimeManager()
