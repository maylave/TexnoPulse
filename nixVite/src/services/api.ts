export interface BaseEntity {
	id: number | string
	[key: string]: any
}

export interface QueryParams {
	[key: string]: string | number | boolean | undefined | null
}

const API_CONFIG = {
	baseUrl: '/api',
	timeout: 5000
}

const fetchWithTimeout = async (
	url: string,
	options: RequestInit = {}
): Promise<Response> => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

	try {
		const response = await fetch(url, { ...options, signal: controller.signal })
		clearTimeout(timeoutId)
		return response
	} catch (error) {
		clearTimeout(timeoutId)
		throw error
	}
}

async function request<T>(
	endpoint: string,
	method: string = 'GET',
	body?: any,
	params?: QueryParams
): Promise<T> {
	const token = localStorage.getItem('authToken')
	const userStr = localStorage.getItem('user')
	const userId = userStr ? JSON.parse(userStr).id : null

	const url = new URL(
		`${API_CONFIG.baseUrl}${endpoint}`,
		window.location.origin
	)
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.append(key, String(value))
			}
		})
	}

	const headers: HeadersInit = {
		'Content-Type': 'application/json'
	}
	if (token) headers['Authorization'] = `Bearer ${token}`

	if (userId && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
		headers['X-User-Id'] = String(userId)
	}

	const options: RequestInit = {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined
	}

	try {
		const res = await fetchWithTimeout(url.toString(), options)

		if (!res.ok) {
			const errText = await res.text().catch(() => 'Server error')
			throw new Error(`HTTP ${res.status}: ${errText}`)
		}

		if (res.status === 204) return null as unknown as T

		return await res.json()
	} catch (e: any) {
		console.error(`[API] ${method} ${endpoint} failed:`, e.message)
		throw e
	}
}

function createResource<T extends BaseEntity>(resource: string) {
	const path = `/${resource}`

	return {
		// Получить список (с фильтрами)
		getAll: (params?: QueryParams) =>
			request<T[]>(path, 'GET', undefined, params),

		// Получить один элемент по ID
		getById: (id: number | string) => request<T>(`${path}/${id}`),

		// Создать новый элемент
		create: (data: Partial<T>) => request<T>(path, 'POST', data),

		// Полное обновление
		update: (id: number | string, data: Partial<T>) =>
			request<T>(`${path}/${id}`, 'PUT', data),

		// Частичное обновление
		patch: (id: number | string, data: Partial<T>) =>
			request<T>(`${path}/${id}`, 'PATCH', data),

		// Удалить
		delete: (id: number | string) => request<void>(`${path}/${id}`, 'DELETE')
	}
}

export const api = {
	users: createResource<User>('users'),

	auth: {
		login: (credentials: { login: string; password: string }) =>
			request<{ token: string; user: User }>(
				'/auth/login',
				'POST',
				credentials
			),

		register: (data: Partial<User>) => request<User>('/users', 'POST', data),

		logout: () => {
			localStorage.removeItem('authToken')
			localStorage.removeItem('user')
		},

		refreshToken: () => request<{ token: string }>('/auth/refresh', 'POST')
	},

	profile: {
		get: () => request<User>('/users/profile'), // Или
		update: (data: Partial<User>) =>
			request<User>('/users/profile', 'PATCH', data),

		uploadAvatar: (formData: FormData) => {
			const token = localStorage.getItem('authToken')
			return fetchWithTimeout(`${API_CONFIG.baseUrl}/users/profile/avatar`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: formData
			}).then(res => {
				if (!res.ok) throw new Error('Upload failed')
				return res.json()
			})
		}
	},

	reports: {
		generateMonthly: (year: number, month: number) =>
			request<Blob>(`/reports/monthly?year=${year}&month=${month}`, 'GET')
	}
}

export interface User extends BaseEntity {
	username: string
	email: string
	role?: 'admin' | 'user' | 'moderator'
	avatarUrl?: string
	createdAt?: string
}
