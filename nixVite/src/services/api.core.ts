import type { QueryParams } from '../types'

export const API_CONFIG = {
	baseUrl: 'http://localhost:3000/api',
	timeout: 5000
}
export const fetchWithTimeout = async (
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

export async function request<T>(
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
