import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api.resources'
import type { AuthResponse, User } from '../types'

export const useAuthStore = defineStore('auth', () => {
	const router = useRouter()

	const user = ref<User | null>(null)
	const token = ref<string | null>(localStorage.getItem('authToken'))
	const isLoading = ref(false)

	const isAuthenticated = computed(() => !!token.value)
	const userName = computed(
		() => user.value?.name || user.value?.username || 'Гость'
	)
	const userAvatar = computed(() => user.value?.avatarUrl || '')

	async function login(credentials: { login: string; password: string }) {
		isLoading.value = true
		try {
			const response: AuthResponse = await api.auth.login(credentials)

			token.value = response.token
			user.value = response.user

			localStorage.setItem('authToken', response.token)
			if (response.user) {
				localStorage.setItem('user', JSON.stringify(response.user))
			}

			router.push('/')
		} catch (error) {
			console.error('Login failed', error)
			throw error
		} finally {
			isLoading.value = false
		}
	}

	async function register(data: Partial<User>) {
		isLoading.value = true
		try {
			await api.auth.register(data)
			return true
		} catch (error) {
			console.error('Register failed', error)
			throw error
		} finally {
			isLoading.value = false
		}
	}

	function logout() {
		api.auth.logout()
		token.value = null
		user.value = null
		localStorage.removeItem('authToken')
		localStorage.removeItem('user')
		router.push('/auth')
	}

	// --- ИЗМЕНЕННАЯ ФУНКЦИЯ INIT AUTH ---
	async function initAuth() {
		const storedToken = localStorage.getItem('authToken')

		// Если токена нет, выходим
		if (!storedToken) return

		token.value = storedToken
		isLoading.value = true

		try {
			// 1. Пробуем получить свежие данные с сервера
			const freshUser = await api.profile.get()

			// 2. Обновляем реактивную переменную и LocalStorage
			user.value = freshUser
			localStorage.setItem('user', JSON.stringify(freshUser))

			console.log('✅ User data refreshed from API:', freshUser.name)
		} catch (error) {
			console.warn(
				'⚠️ Failed to fetch fresh profile, using cached data or logging out.'
			)

			// Если запрос упал (например, токен протух), пробуем взять из кэша
			const storedUser = localStorage.getItem('user')
			if (storedUser) {
				try {
					user.value = JSON.parse(storedUser) as User
				} catch (e) {
					logout() // Если кэш битый, разлогиниваем
				}
			} else {
				logout() // Если кэша нет, разлогиниваем
			}
		} finally {
			isLoading.value = false
		}
	}

	return {
		user,
		token,
		isLoading,
		isAuthenticated,
		userName,
		userAvatar,
		login,
		register,
		logout,
		initAuth
	}
})
