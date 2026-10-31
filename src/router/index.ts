import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import startView from '@/views/startView.vue'
import Notification from '@/views/Notification.vue'
import PluginView from '@/views/PluginView.vue'
const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			path: '/',
			name: 'start',
			component: startView
		},
		{
			path: '/home',
			name: 'home',
			component: HomeView,
			meta: { requiresAuth: true }
		},
		{
			path: '/plugin',
			name: 'plugin',
			component: PluginView
		},
		{
			path: '/notification',
			name: 'notification',
			component: Notification
		}
	]
})

// Защита маршрутов
router.beforeEach((to, from, next) => {
	const userName = localStorage.getItem('snapi_user_name')

	// Исключения: стартовый экран, окно уведомлений, установщик и плагины не требуют авторизации
	if (
		to.name === 'start' ||
		to.name === 'notification' ||
		to.name === 'installer' ||
		to.name === 'plugin'
	) {
		return next()
	}

	if (to.meta.requiresAuth && !userName) {
		return next({ name: 'start' })
	}

	next()
})

export default router
