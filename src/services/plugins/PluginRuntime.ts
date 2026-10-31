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
  private overriddenProperties = new Map<string, string[]>()
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>()
  private activeInstances = new Map<string, { uninstall?: (ctx: PluginContext) => void }>()

  /**
   * Парсинг CSS переменных из блока стилей плагина
   */
  private extractCssVariables(cssText: string): Record<string, string> {
    const vars: Record<string, string> = {}
    const regex = /(--[\w-]+)\s*:\s*([^;!]+)(?:!important)?\s*;/g
    let match
    while ((match = regex.exec(cssText)) !== null) {
      vars[match[1].trim()] = match[2].trim()
    }
    return vars
  }

  /**
   * Применить CSS стили плагина (тему)
   */
  applyStyles(pluginId: string, styles: string) {
    this.removeStyles(pluginId)
    if (!styles || !styles.trim()) return

    // 1. Создаем тег <style> для глобальных CSS правил
    const styleEl = document.createElement('style')
    styleEl.id = `snapi-plugin-theme-${pluginId}`
    styleEl.setAttribute('data-plugin-id', pluginId)
    styleEl.textContent = styles
    document.head.appendChild(styleEl)
    this.activeStyles.set(pluginId, styleEl)

    // 2. Устанавливаем data-атрибуты на html и body
    document.documentElement.setAttribute('data-plugin-theme', pluginId)
    document.body.setAttribute('data-plugin-theme', pluginId)

    // 3. Прямая установка CSS-переменных на root для максимального приоритета
    const vars = this.extractCssVariables(styles)
    const appliedVars: string[] = []

    for (const [key, val] of Object.entries(vars)) {
      document.documentElement.style.setProperty(key, val, 'important')
      appliedVars.push(key)
    }

    this.overriddenProperties.set(pluginId, appliedVars)

    // 4. Сохраняем активную тему в localStorage
    try {
      localStorage.setItem('snapi_active_plugin_theme', pluginId)
    } catch {}
  }

  /**
   * Удалить стили темы плагина
   */
  removeStyles(pluginId: string) {
    // 1. Удаляем тег <style>
    const existing = this.activeStyles.get(pluginId) || document.getElementById(`snapi-plugin-theme-${pluginId}`)
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing)
    }
    this.activeStyles.delete(pluginId)

    // 2. Удаляем установленные переменные
    const props = this.overriddenProperties.get(pluginId) || []
    for (const prop of props) {
      document.documentElement.style.removeProperty(prop)
    }
    this.overriddenProperties.delete(pluginId)

    // 3. Снимаем data-атрибуты
    if (document.documentElement.getAttribute('data-plugin-theme') === pluginId) {
      document.documentElement.removeAttribute('data-plugin-theme')
    }
    if (document.body.getAttribute('data-plugin-theme') === pluginId) {
      document.body.removeAttribute('data-plugin-theme')
    }

    try {
      if (localStorage.getItem('snapi_active_plugin_theme') === pluginId) {
        localStorage.removeItem('snapi_active_plugin_theme')
      }
    } catch {}
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
        console.log(`%c[Plugin: ${plugin.name}] %c${title}: ${body}`, 'color: #38bdf8; font-weight: bold;', 'color: white;')
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification(title, { body }) } catch {}
        }
      },
      setThemeVariables: (vars: Record<string, string>) => {
        for (const [key, val] of Object.entries(vars)) {
          const varName = key.startsWith('--') ? key : `--${key}`
          document.documentElement.style.setProperty(varName, val, 'important')
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
   * Запустить плагин (применить тему и исполнить JS код)
   */
  async activate(plugin: InstalledPlugin) {
    console.log(`[PluginRuntime] >>> АКТИВАЦИЯ ПЛАГИНА: ${plugin.name} (${plugin.id})`);

    // 1. Применяем стили/тему, если есть
    if (plugin.styles && plugin.styles.trim()) {
      this.applyStyles(plugin.id, plugin.styles)
    }

    // 2. Выполняем JS логику плагина
    if (plugin.code && plugin.code.trim()) {
      try {
        const context = this.createContext(plugin)
        let pluginModule: any = null

        // Преобразуем export default в return
        const cleanCode = plugin.code.replace(/export\s+default\s+/, 'return ')
        try {
          const factory = new Function('context', `
            "use strict";
            ${cleanCode}
          `)
          pluginModule = factory(context)
        } catch {
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
    console.log(`[PluginRuntime] <<< ДЕАКТИВАЦИЯ ПЛАГИНА: ${plugin.name} (${plugin.id})`);

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
