// src/services/services.ts
import type { CartItem, Order } from '@/types'
import { api } from './api.resources'

// Экспортируем основной API, чтобы использовать в компонентах напрямую
export { api }

// --- Локальные сервисы (Business Logic) ---

// Сервис работы с корзиной (Local Storage + API)
export const cartService = {
	load: (): CartItem[] => {
		const saved = localStorage.getItem('cart')
		return saved ? JSON.parse(saved) : []
	},
	save: (items: CartItem[]) => {
		localStorage.setItem('cart', JSON.stringify(items))
	},
	clear: () => {
		localStorage.removeItem('cart')
	}
}

// Сервис работы с заказами
export const orderService = {
	create: async (items: CartItem[]): Promise<Order> => {
		const total = items.reduce((sum, item) => {
			return sum + item.product.price * item.quantity
		}, 0)

		const newOrder: Order = {
			id: Date.now(),
			items: items,
			total: total,
			date: new Date(),
			status: 'confirmed',
			userId: JSON.parse(localStorage.getItem('user') || '{}').id
		}

		console.log('✅ Заказ создан локально:', newOrder)
		return newOrder
	}
}
