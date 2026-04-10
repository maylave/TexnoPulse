// src/stores/cart.ts
import type { Product } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

interface CartItem {
	product: Product
	quantity: number
}

export const useCartStore = defineStore('cart', () => {
	const items = ref<CartItem[]>([])

	// 1. ДОБАВЛЯЕМ isLoading
	const isLoading = ref(false)

	// Загрузка из LS
	const savedCart = localStorage.getItem('cart')
	if (savedCart) {
		try {
			items.value = JSON.parse(savedCart)
		} catch (e) {
			items.value = []
		}
	}

	const totalItems = computed(() =>
		items.value.reduce((acc, item) => acc + item.quantity, 0)
	)
	const totalPrice = computed(() =>
		items.value.reduce(
			(acc, item) => acc + item.product.price * item.quantity,
			0
		)
	)
	const isEmpty = computed(() => items.value.length === 0)

	function addToCart(product: Product, qty: number = 1) {
		const existingItem = items.value.find(i => i.product.id === product.id)
		if (existingItem) {
			existingItem.quantity += qty
		} else {
			items.value.push({ product, quantity: qty })
		}
		saveCart()
	}

	// 2. ПРИНИМАЕМ number | string
	function removeFromCart(productId: number | string) {
		items.value = items.value.filter(i => i.product.id !== productId)
		saveCart()
	}

	// 3. ПРИНИМАЕМ number | string
	function updateQuantity(productId: number | string, qty: number) {
		const item = items.value.find(i => i.product.id === productId)
		if (item) {
			if (qty <= 0) {
				removeFromCart(productId)
			} else {
				item.quantity = qty
				saveCart()
			}
		}
	}

	function clearCart() {
		items.value = []
		saveCart()
	}

	function saveCart() {
		localStorage.setItem('cart', JSON.stringify(items.value))
	}

	async function checkout() {
		if (items.value.length === 0) return

		// 4. УПРАВЛЯЕМ isLoading
		isLoading.value = true
		try {
			await new Promise(resolve => setTimeout(resolve, 1000)) // Имитация API
			console.log('Order created')
			clearCart()
		} catch (error) {
			console.error(error)
			throw error
		} finally {
			isLoading.value = false
		}
	}

	// 5. ВОЗВРАЩАЕМ isLoading В ОБЪЕКТ
	return {
		items,
		totalItems,
		totalPrice,
		isEmpty,
		isLoading, // <--- ВАЖНО!
		addToCart,
		removeFromCart,
		updateQuantity,
		clearCart,
		checkout
	}
})
