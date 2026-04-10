// src/types/index.ts

// --- Базовые типы для API ---
export interface BaseEntity {
	id: number | string
	[key: string]: any
}

export interface QueryParams {
	[key: string]: string | number | boolean | undefined | null
}

// --- Модели данных (Domain Models) ---

export interface User extends BaseEntity {
	username: string
	name?: string // Добавил name, так как в форме используется formState.username/name
	email: string
	password?: string
	role?: 'admin' | 'user' | 'moderator' | 'support'
	avatarUrl?: string
	createdAt?: string
	phone?: string // Добавил, так как есть в форме профиля
	city?: string // Добавил, так как есть в форме профиля
}

export interface Product extends BaseEntity {
	title: string
	price: number
	oldPrice?: number
	discountPercentage?: number
	rating: number
	stock: number
	brand?: string
	category: string
	thumbnail: string
	image: string
	images?: string[]
	description?: string
	tags?: string[]
}

// Единый интерфейс для элемента корзины
export interface CartItem {
	id?: number // ID записи в таблице связи (pivot)
	productId: number // ID товара
	product: Product // Вложенный объект товара
	quantity: number
	price: number // Цена на момент добавления в корзину
}

export interface Order {
	id: number | string
	items: CartItem[]
	total_price: number // Используем одно поле для итоговой суммы (число)
	created_at: string // ISO строка даты (стандарт для JSON API)
	status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
	userId?: number | string
	address?: string // Адрес доставки
	comment?: string // Комментарий к заказу
}

export interface AuthResponse {
	token: string
	user: User
}

export interface TokenResponse {
	token: string
}

export interface DashboardStats {
	totalRevenue: number
	newOrders: number
	totalUsers: number
	serverLoad: number
}
