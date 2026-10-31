// src/services/plugins/sdk/createPluginAPI.ts
import type { InstalledPlugin } from '@/services/plugins/PluginRuntime'
import type {
  SnapiPluginAPI,
  SnapiStorageAPI,
  SnapiMessagesAPI,
  SnapiUiAPI,
  SnapiThemeAPI,
  SnapiEventsAPI,
  PluginBlockDefinition,
  FloatingWidgetOptions
} from './types'
import { pluginBlockRegistry } from './BlockRegistry'

export function createPluginAPI(
  plugin: InstalledPlugin,
  runtime: {
    applyStyles: (pluginId: string, styles: string) => void
    removeStyles: (pluginId: string) => void
    eventListeners: Map<string, Set<(...args: any[]) => void>>
  }
): SnapiPluginAPI {
  const prefix = `snapi_p_${plugin.id}_`

  // 1. Изолированное безопасное хранилище плагина
  const storage: SnapiStorageAPI = {
    get<T = any>(key: string, defaultValue?: T): T | null {
      try {
        const raw = localStorage.getItem(`${prefix}${key}`)
        if (raw === null) return defaultValue !== undefined ? defaultValue : null
        return JSON.parse(raw)
      } catch {
        return defaultValue !== undefined ? defaultValue : null
      }
    },
    set(key: string, value: any): void {
      try {
        localStorage.setItem(`${prefix}${key}`, JSON.stringify(value))
      } catch (e) {
        console.error(`[Plugin Storage: ${plugin.id}] Ошибка записи ключа "${key}":`, e)
      }
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(`${prefix}${key}`)
      } catch {}
    },
    clear(): void {
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith(prefix)) {
            keysToRemove.push(k)
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k)
        }
      } catch {}
    }
  }

  // 2. Регистрация кастомных блоков сообщений
  const messages: SnapiMessagesAPI = {
    registerBlock(type: string, definition: PluginBlockDefinition) {
      console.log(`[Plugin: ${plugin.id}] Регистрация типа сообщения: "${type}"`)
      pluginBlockRegistry.register(type, definition)
    },
    unregisterBlock(type: string) {
      pluginBlockRegistry.unregister(type)
    },
    getBlock(type: string) {
      return pluginBlockRegistry.getDefinition(type)
    }
  }

  // 3. Безопасный интерфейс (UI)
  const ui: SnapiUiAPI = {
    showNotification(title: string, body: string) {
      console.log(`%c[Plugin: ${plugin.name}] %c${title}: ${body}`, 'color: #38bdf8; font-weight: bold;', 'color: white;')
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try { new Notification(title, { body }) } catch {}
      }
    },
    showToast(text: string, type: 'info' | 'success' | 'error' = 'info') {
      const toast = document.createElement('div')
      toast.className = `snapi-toast snapi-toast-${type}`
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(15, 23, 42, 0.95);
        color: #fff;
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid ${type === 'error' ? 'rgba(239, 68, 68, 0.4)' : type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(56, 189, 248, 0.4)'};
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        z-index: 1000000;
        opacity: 0;
        transition: all 0.25s ease;
        pointer-events: none;
      `
      toast.textContent = text
      document.body.appendChild(toast)

      requestAnimationFrame(() => {
        toast.style.opacity = '1'
        toast.style.transform = 'translateX(-50%) translateY(0)'
      })

      setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transform = 'translateX(-50%) translateY(20px)'
        setTimeout(() => toast.remove(), 250)
      }, 3000)
    },
    addFloatingWidget(options: FloatingWidgetOptions) {
      const container = document.createElement('div')
      container.id = options.id || `snapi-widget-${plugin.id}-${Date.now()}`
      container.className = `snapi-floating-widget pos-${options.position || 'bottom-right'}`
      
      const pos = options.position || 'bottom-right'
      let posStyle = 'bottom: 24px; right: 24px;'
      if (pos === 'bottom-left') posStyle = 'bottom: 24px; left: 24px;'
      else if (pos === 'top-right') posStyle = 'top: 24px; right: 24px;'
      else if (pos === 'top-left') posStyle = 'top: 24px; left: 24px;'

      container.style.cssText = `
        position: fixed;
        ${posStyle}
        z-index: 99999;
        font-family: inherit;
      `

      if (options.html) {
        container.innerHTML = options.html
      }

      document.body.appendChild(container)
      if (options.onMount) {
        options.onMount(container)
      }

      return {
        remove() {
          container.remove()
        }
      }
    }
  }

  // 4. Темы оформления
  const theme: SnapiThemeAPI = {
    setTokens(tokens: Record<string, string>) {
      for (const [key, val] of Object.entries(tokens)) {
        const varName = key.startsWith('--') ? key : `--${key}`
        document.documentElement.style.setProperty(varName, val, 'important')
      }
    },
    reset() {
      runtime.removeStyles(plugin.id)
    }
  }

  // 5. События
  const events: SnapiEventsAPI = {
    on(event: string, handler: (...args: any[]) => void) {
      if (!runtime.eventListeners.has(event)) {
        runtime.eventListeners.set(event, new Set())
      }
      runtime.eventListeners.get(event)!.add(handler)
    },
    off(event: string, handler: (...args: any[]) => void) {
      const listeners = runtime.eventListeners.get(event)
      if (listeners) {
        listeners.delete(handler)
      }
    },
    emit(event: string, ...args: any[]) {
      const listeners = runtime.eventListeners.get(event)
      if (listeners) {
        for (const l of listeners) {
          try { l(...args) } catch (err) { console.error(`[Plugin Event Error]`, err) }
        }
      }
    }
  }

  return {
    id: plugin.id,
    name: plugin.name,
    version: plugin.version,
    storage,
    messages,
    ui,
    theme,
    events
  }
}
