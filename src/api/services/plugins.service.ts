import { pluginsHttpClient, httpClient } from './http.client'

export interface ServerPluginManifest {
  id: string
  name: string
  version: string
  desc: string
  author: string
  icon: string
  categoryId: 'visual' | 'ai' | 'sync' | 'utils'
  downloads?: number
  rating?: number
  hasTheme?: boolean
  styles?: string
  code?: string
  createdAt?: string
}

async function requestWithFallback<T>(url: string, method: 'get' | 'post' | 'delete' = 'get', data?: any) {
  try {
    // 1. Сначала обращаемся к выделенному серверу плагинов (порт 4000 или удаленный)
    if (method === 'post') {
      return await pluginsHttpClient.post<T>(url, data, { timeout: 2500 })
    } else if (method === 'delete') {
      return await pluginsHttpClient.delete<T>(url, { timeout: 2500 })
    }
    return await pluginsHttpClient.get<T>(url, { timeout: 2500 })
  } catch (err: any) {
    // 2. Fallback: если отдельный сервер плагинов выключен, проверяем основной локальный бэкенд (порт 3000)
    console.warn(`[Plugins Service] Запрос к серверу плагинов не удался, пробуем резервный локальный бэкенд...`)
    if (method === 'post') {
      return await httpClient.post<T>(url, data)
    } else if (method === 'delete') {
      return await httpClient.delete<T>(url)
    }
    return await httpClient.get<T>(url)
  }
}

export const pluginsService = {
  // 1. Получить список всех плагинов с сервера
  getAll: () => requestWithFallback<{ data: ServerPluginManifest[]; count: number }>('/plugins'),

  // 2. Получить плагин по ID
  getById: (id: string) => requestWithFallback<ServerPluginManifest>(`/plugins/${id}`),

  // 3. Скачать плагин по ID (возвращает манифест, бандл кода и стили)
  download: (id: string) => requestWithFallback<{
    manifest: ServerPluginManifest
    code: string
    styles: string
    downloadedAt: string
  }>(`/plugins/${id}/download`),

  // 4. Опубликовать сторонний плагин на сервер
  upload: (pluginData: Partial<ServerPluginManifest>) =>
    requestWithFallback<{ success: boolean; plugin: ServerPluginManifest }>('/plugins/upload', 'post', pluginData),

  // 5. Удалить плагин с сервера
  delete: (id: string) => requestWithFallback<{ success: boolean; message: string }>(`/plugins/${id}`, 'delete')
}
