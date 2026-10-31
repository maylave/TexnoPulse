import axios from 'axios'

export function getApiBaseUrl(): string {
  // 1. Проверяем сохраненный порт из localStorage
  const savedPort = localStorage.getItem('snapi_custom_port') || localStorage.getItem('snapi_active_port')
  const port = savedPort ? parseInt(savedPort, 10) : 3000
  return `http://127.0.0.1:${port}/api`
}

export const httpClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Динамически подставляем актуальный порт бэкенда перед каждым запросом
httpClient.interceptors.request.use(config => {
  config.baseURL = getApiBaseUrl()
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
