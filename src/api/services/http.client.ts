import axios from 'axios'

/**
 * URL основного локального бэкенда мессенджера (чаты, P2P, БД)
 */
export function getApiBaseUrl(): string {
  const savedPort = localStorage.getItem('snapi_custom_port') || localStorage.getItem('snapi_active_port')
  const port = savedPort ? parseInt(savedPort, 10) : 3000
  return `http://127.0.0.1:${port}/api`
}

/**
 * URL второго сервера плагинов и каталога расширений (Plugins & Marketplace Backend)
 * Поддерживает кастомный удаленный адрес для будущего переноса на отдельный сервер!
 */
export function getPluginsServerBaseUrl(): string {
  // 1. Если пользователь настроил удаленный сервер плагинов
  const customRemote = localStorage.getItem('snapi_plugins_server_url')
  if (customRemote && customRemote.trim()) {
    let clean = customRemote.trim()
    if (!clean.endsWith('/api')) {
      clean = clean.replace(/\/+$/, '') + '/api'
    }
    return clean
  }

  // 2. Локальный выделенный сервер плагинов (порт 4000)
  return 'http://127.0.0.1:4000/api'
}

export const httpClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
})

httpClient.interceptors.request.use(config => {
  config.baseURL = getApiBaseUrl()
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Отдельный HTTP-клиент для связи со ВТОРЫМ сервером плагинов
 */
export const pluginsHttpClient = axios.create({
  baseURL: getPluginsServerBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
})

pluginsHttpClient.interceptors.request.use(config => {
  config.baseURL = getPluginsServerBaseUrl()
  return config
})
