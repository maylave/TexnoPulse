import type {
	AuthResponse,
	BaseEntity,
	CartItem,
	DashboardStats,
	Order,
	Product,
	QueryParams,
	TokenResponse,
	User
} from '../types'
import { request } from './api.core'

function createResource<T extends BaseEntity>(resource: string) {
	const path = `/${resource}`

	return {
		getAll: (params?: QueryParams) =>
			request<T[]>(path, 'GET', undefined, params),
		getById: (id: number | string) => request<T>(`${path}/${id}`),
		create: (data: Partial<T>) => request<T>(path, 'POST', data),
		update: (id: number | string, data: Partial<T>) =>
			request<T>(`${path}/${id}`, 'PUT', data),
		patch: (id: number | string, data: Partial<T>) =>
			request<T>(`${path}/${id}`, 'PATCH', data),
		delete: (id: number | string) => request<void>(`${path}/${id}`, 'DELETE')
	}
}

// --- Specific APIs ---

export const api = {
	// 1. Пользователи (Admin)
	users: createResource<User>('users'),

	auth: {
		login: (credentials: { login: string; password: string }) =>
			request<AuthResponse>('/auth/login', 'POST', credentials),

		register: (data: Partial<User>) =>
			request<User>('/auth/register', 'POST', data),

		logout: () => {
			localStorage.removeItem('authToken')
			localStorage.removeItem('user')
		},

		refreshToken: () => request<TokenResponse>('/auth/refresh', 'POST')
	},

	profile: {
		get: () => request<User>('/users/me'),
		update: (data: Partial<User>) => request<User>('/users/me', 'PATCH', data),
		uploadAvatar: (formData: FormData) =>
			request<{ avatarUrl: string }>('/users/me/avatar', 'POST', formData)
	},

	// 4. Каталог товаров (Products)
	products: {
		...createResource<Product>('products'),

		search: (query: string, category?: string) =>
			request<Product[]>('/products/search', 'GET', undefined, {
				q: query,
				category
			}),

		// Получение популярных товаров для главной страницы
		getFeatured: () => request<Product[]>('/products/featured')
	},

	// 5. Корзина (Cart)
	cart: {
		// Получить корзину текущего пользователя
		get: () => request<CartItem[]>('/cart'),

		// Добавить товар
		add: (productId: number, quantity: number = 1) =>
			request<CartItem>('/cart/items', 'POST', { productId, quantity }),

		// Обновить количество
		updateItem: (itemId: number, quantity: number) =>
			request<CartItem>(`/cart/items/${itemId}`, 'PATCH', { quantity }),

		// Удалить товар из корзины
		removeItem: (itemId: number) =>
			request<void>(`/cart/items/${itemId}`, 'DELETE'),

		// Очистить корзину
		clear: () => request<void>('/cart', 'DELETE')
	},

	// 6. Заказы (Orders)
	orders: {
		...createResource<Order>('orders'),

		// Создать заказ из корзины
		checkout: (payload: { address?: string; comment?: string }) =>
			request<Order>('/orders/checkout', 'POST', payload),

		// Мои заказы (для профиля)
		myOrders: (params?: QueryParams) =>
			request<Order[]>('/orders/my', 'GET', undefined, params)
	},

	// 7. Админка / Отчеты
	admin: {
		// Статистика для дашборда
		getStats: () => request<DashboardStats>('/admin/stats'),

		// Генерация отчетов
		reports: {
			generateMonthly: (year: number, month: number) =>
				request<Blob>(
					`/admin/reports/monthly?year=${year}&month=${month}`,
					'GET'
				)
		}
	}
}
