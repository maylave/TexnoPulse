import pool from '../config/db.js'

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ПРОВЕРКИ АДМИНА ---
const checkAdminRole = async (userId) => {
	const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId])
	if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
		throw new Error('Access denied')
	}
	return true
}

// --- ПУБЛИЧНЫЕ МЕТОДЫ ---

export const getProducts = async (req, res) => {
	try {
		const { category, search, limit = 20, page = 1 } = req.query
		let query = 'SELECT * FROM products WHERE is_active = true'
		const values = []

		// ... (твоя логика фильтрации без изменений) ...
		if (category && category !== 'all') {
			query += ` AND category = $${values.length + 1}`
			values.push(category)
		}
		if (search) {
			query += ` AND title ILIKE $${values.length + 1}`
			values.push(`%${search}%`)
		}

		const offset = (page - 1) * limit
		query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`
		values.push(limit, offset)

		const result = await pool.query(query, values)
		// Для простоты пока без COUNT, если пагинация не критична на бэке
		res.json(result.rows)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при получении товаров' })
	}
}

export const getProductById = async (req, res) => {
	try {
		const { id } = req.params
		const result = await pool.query('SELECT * FROM products WHERE id = $1', [id])
		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Товар не найден' })
		}
		res.json(result.rows[0])
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при получении товара' })
	}
}

export const getFeaturedProducts = async (req, res) => {
	try {

		const result = await pool.query('SELECT * FROM products WHERE is_featured = true ORDER BY created_at DESC LIMIT 8')
		res.json(result.rows)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при получении популярных товаров' })
	}
}




export const getAllProductsAdmin = async (req, res) => {
	try {
		// 1. Проверка прав
		await checkAdminRole(req.user.id)

		// 2. Запрос данных
		const result = await pool.query('SELECT * FROM products ORDER BY id DESC')
		res.json(result.rows)
	} catch (err) {
		if (err.message === 'Access denied') {
			return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' })
		}
		console.error(err)
		res.status(500).json({ error: 'Ошибка сервера' })
	}
}


export const createProduct = async (req, res) => {
	try {

		await checkAdminRole(req.user.id)


		const { title, price, old_price, category, image, description, stock, brand, is_featured } = req.body


		const result = await pool.query(
			`INSERT INTO products 
            (title, price, old_price, category, image, description, stock, brand, is_featured) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
			[title, price, old_price, category, image, description, stock, brand, is_featured || false]
		)
		res.status(201).json(result.rows[0])

	} catch (err) {
		if (err.message === 'Access denied') {
			return res.status(403).json({ error: 'Доступ запрещен.' })
		}
		console.error(err)
		res.status(500).json({ error: 'Ошибка при создании товара' })
	}
}


export const updateProduct = async (req, res) => {
	try {
		// 1. Проверка прав
		await checkAdminRole(req.user.id)

		const productId = req.params.id
		const { title, price, old_price, category, image, description, stock, brand, is_featured } = req.body

		const result = await pool.query(
			`UPDATE products 
            SET title=$1, price=$2, old_price=$3, category=$4, image=$5, description=$6, stock=$7, brand=$8, is_featured=$9 
            WHERE id=$10 RETURNING *`,
			[title, price, old_price, category, image, description, stock, brand, is_featured, productId]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Товар не найден' })
		}
		res.json(result.rows[0])

	} catch (err) {
		if (err.message === 'Access denied') {
			return res.status(403).json({ error: 'Доступ запрещен.' })
		}
		console.error(err)
		res.status(500).json({ error: 'Ошибка при обновлении товара' })
	}
}

// Удалить товар
export const deleteProduct = async (req, res) => {
	try {
		// 1. Проверка прав
		await checkAdminRole(req.user.id)

		const productId = req.params.id
		await pool.query('DELETE FROM products WHERE id = $1', [productId])
		res.json({ message: 'Товар удален' })

	} catch (err) {
		if (err.message === 'Access denied') {
			return res.status(403).json({ error: 'Доступ запрещен.' })
		}
		console.error(err)
		res.status(500).json({ error: 'Ошибка при удалении товара' })
	}
}

export default {
	getProducts,
	getProductById,
	getFeaturedProducts,
	getAllProductsAdmin,
	createProduct,
	updateProduct,
	deleteProduct,
}