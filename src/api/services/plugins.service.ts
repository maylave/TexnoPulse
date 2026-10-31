import { httpClient } from './http.client'

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

export const pluginsService = {
  // 1. Получить список всех плагинов с сервера
  getAll: () => httpClient.get<{ data: ServerPluginManifest[]; count: number }>('/plugins'),

  // 2. Получить плагин по ID
  getById: (id: string) => httpClient.get<ServerPluginManifest>(`/plugins/${id}`),

  // 3. Скачать плагин по ID (возвращает манифест, бандл кода и стили)
  download: (id: string) => httpClient.get<{
    manifest: ServerPluginManifest
    code: string
    styles: string
    downloadedAt: string
  }>(`/plugins/${id}/download`),

  // 4. Опубликовать сторонний плагин на сервер
  upload: (pluginData: Partial<ServerPluginManifest>) =>
    httpClient.post<{ success: boolean; plugin: ServerPluginManifest }>('/plugins/upload', pluginData),

  // 5. Удалить плагин с сервера
  delete: (id: string) => httpClient.delete(`/plugins/${id}`)
}
