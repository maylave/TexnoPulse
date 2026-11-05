import './assets/main.css'
import './assets/globals.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { useMessagesStore } from '@/stores/messages'

import App from './App.vue'
import router from './router'
import { api } from '@/api/client'
import { registerModals } from '@/config/registerModals'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

// 1. Инициализируем тему
const theme = useThemeStore()

// 3. Инициализируем слушатели сокета и запускаем подключение
const messagesStore = useMessagesStore()
messagesStore.init()

if (typeof (api as any).connect === 'function') {
	;(api as any).connect()
}
registerModals()
app.use(router)
app.mount('#app')
