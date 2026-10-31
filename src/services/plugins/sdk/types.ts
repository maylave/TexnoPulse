// src/services/plugins/sdk/types.ts

export interface PluginBlockContext {
  container: HTMLElement
  block: any
  message?: any
}

export interface PluginBlockDefinition {
  render: (container: HTMLElement, block: any) => void | (() => void)
  containerClass?: string
  marginBottom?: string
}

export interface FloatingWidgetOptions {
  id?: string
  html?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  onMount?: (container: HTMLElement) => void
}

export interface SnapiStorageAPI {
  get<T = any>(key: string, defaultValue?: T): T | null
  set(key: string, value: any): void
  remove(key: string): void
  clear(): void
}

export interface SnapiMessagesAPI {
  registerBlock(type: string, definition: PluginBlockDefinition): void
  unregisterBlock(type: string): void
  getBlock(type: string): PluginBlockDefinition | undefined
}

export interface SnapiUiAPI {
  showNotification(title: string, body: string): void
  showToast(text: string, type?: 'info' | 'success' | 'error'): void
  addFloatingWidget(options: FloatingWidgetOptions): { remove: () => void }
}

export interface SnapiThemeAPI {
  setTokens(tokens: Record<string, string>): void
  reset(): void
}

export interface SnapiEventsAPI {
  on(event: string, handler: (...args: any[]) => void): void
  off(event: string, handler: (...args: any[]) => void): void
  emit(event: string, ...args: any[]): void
}

export interface SnapiPluginAPI {
  id: string
  name: string
  version: string
  storage: SnapiStorageAPI
  messages: SnapiMessagesAPI
  ui: SnapiUiAPI
  theme: SnapiThemeAPI
  events: SnapiEventsAPI
  // Обратная совместимость для существующих плагинов
  showNotification: (title: string, body: string) => void
  setThemeVariables: (vars: Record<string, string>) => void
  addStyle: (cssText: string) => void
  removeStyle: () => void
  on: (event: string, handler: (...args: any[]) => void) => void
  emit: (event: string, ...args: any[]) => void
}
