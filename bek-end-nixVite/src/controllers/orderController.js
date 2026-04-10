import pool from '../config/db.js'
import { authMiddleware } from './userController.js'

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ МАППИНГА ---
// Превращает плоские строки из БД в структуру, удобную для фронта
const formatCartItem = (row) => ({
	id: row.id, // ID записи в cart_items
	productId: row.product_id,
	quantity: parseInt(row.quantity),
	price: parseFloat(row.price), // Цена на момент добавления (или текущая)
	product: {
		id: row.id, // Здесь лучше использовать row.product_id, но так как JOIN, то id может конфликтовать с id корзины. Лучше явно выбрать p.id as product_id
		title: row.title,
		price: parseFloat(row.price),
		oldPrice: row.old_price ? parseFloat(row.old_price) : null,
		category: row.category,
		thumbnail: row.thumbnail,
		image: row.image,
		stock: parseInt(row.stock),
		rating: parseFloat(row.rating) || 0
	}
})

// Получить корзину текущего пользователя
export const getCart = async (req, res) => {
	try {
		const userId = req.user.id

		// ВАЖНО: Явно выбираем поля, чтобы избежать конфликта имен id (cart_items.id vs products.id)
		const result = await pool.query(`
			SELECT 
				ci.id as cart_item_id, 
				ci.quantity, 
				p.id as product_id,
				p.title, 
				p.price, 
				p.old_price,
				p.category, 
				p.thumbnail, 
				p.image, 
				p.stock,
				p.rating
			FROM cart_items ci
			JOIN products p ON ci.product_id = p.id
			WHERE ci.user_id = $1
		`, [userId])

		// Маппим данные в формат, который ждет CartStore на Vue
		const formattedItems = result.rows.map(row => ({
			id: row.cart_item_id,
			productId: row.product_id,
			quantity: parseInt(row.quantity),
			price: parseFloat(row.price),
			product: {
				id: row.product_id,
				title: row.title,
				price: parseFloat(row.price),
				oldPrice: row.old_price ? parseFloat(row.old_price) : null,
				category: row.category,
				thumbnail: row.thumbnail,
				image: row.image,
				stock: parseInt(row.stock),
				rating: parseFloat(row.rating) || 0
			}
		}))

		res.json(formattedItems)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при получении корзины' })
	}
}

// Добавить товар в корзину
export const addToCart = async (req, res) => {
	try {
		const userId = req.user.id
		const { productId, quantity = 1 } = req.body

		// Проверяем наличие товара и его остаток
		const productCheck = await pool.query('SELECT id, stock FROM products WHERE id = $1', [productId])

		if (productCheck.rows.length === 0) {
			return res.status(404).json({ error: 'Товар не найден' })
		}

		const currentStock = productCheck.rows[0].stock
		if (currentStock < quantity) {
			return res.status(400).json({ error: 'Недостаточно товара на складе' })
		}

		// Проверяем, есть ли уже такой товар в корзине
		const existingItem = await pool.query(
			'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
			[userId, productId]
		)

		if (existingItem.rows.length > 0) {
			const newQuantity = existingItem.rows[0].quantity + quantity
			if (newQuantity > currentStock) {
				return res.status(400).json({ error: 'Нельзя добавить больше, чем есть на складе' })
			}
			// Обновляем количество
			await pool.query(
				'UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3',
				[newQuantity, userId, productId]
			)
		} else {
			// Создаем новую запись
			await pool.query(
				'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
				[userId, productId, quantity]
			)
		}

		res.status(200).json({ message: 'Товар добавлен в корзину' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при добавлении в корзину' })
	}
}

// Удалить товар из корзины
export const removeFromCart = async (req, res) => {
	try {
		const userId = req.user.id
		const { itemId } = req.params // Ожидаем ID записи в cart_items

		await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND id = $2', [userId, itemId])
		res.json({ message: 'Товар удален' })
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при удалении из корзины' })
	}
}

// Оформление заказа (Checkout)
export const checkout = async (req, res) => {
	const client = await pool.connect()
	try {
		await client.query('BEGIN')
		console.log('🔥 CHECKOUT STARTED')
		console.log('User ID:', req.user?.id) // Проверка авторизации
		console.log('Body:', req.body)       // Проверка тела запроса
		const userId = req.user.id
		const { address, comment } = req.body

		// 1. Получаем товары из корзины с актуальной ценой
		const cartItems = await client.query(`
			SELECT ci.product_id, ci.quantity, p.price 
			FROM cart_items ci
			JOIN products p ON ci.product_id = p.id
			WHERE ci.user_id = $1
		`, [userId])

		if (cartItems.rows.length === 0) {
			return res.status(400).json({ error: 'Корзина пуста' })
		}

		// 2. Считаем общую сумму
		let total_price = 0
		for (const item of cartItems.rows) {
			total_price += item.price * item.quantity
		}

		// 3. Создаем заказ
		// Внимание: поле total_price должно совпадать с тем, что в types/index.ts

		const orderResult = await client.query(
			`INSERT INTO orders (user_id, total_price, status, address, comment, created_at) 
			 VALUES ($1, $2, 'pending', $3, $4, NOW()) RETURNING *`,
			[userId, total_price, address || '', comment || '']
		)

		const newOrder = orderResult.rows[0]

		// 4. Создаем элементы заказа
		for (const item of cartItems.rows) {
			await client.query(
				`INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) 
				 VALUES ($1, $2, $3, $4)`,
				[newOrder.id, item.product_id, item.quantity, item.price]
			)

			// Уменьшаем сток на складе
			await client.query(
				'UPDATE products SET stock = stock - $1 WHERE id = $2',
				[item.quantity, item.product_id]
			)
		}

		// 5. Очищаем корзину
		await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId])

		await client.query('COMMIT')

		// Возвращаем полный объект заказа, чтобы фронтенд мог сразу его отобразить
		res.status(201).json(newOrder)

	} catch (err) {
		await client.query('ROLLBACK')
		console.error(err)
		res.status(500).json({ error: 'Ошибка при оформлении заказа' })
	} finally {
		client.release()
	}
}

export default {
	getCart,
	addToCart,
	removeFromCart,
	checkout
}