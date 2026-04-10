import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import orderController from '../controllers/orderController.js'
import productController from '../controllers/productController.js'
import userController, { authMiddleware } from '../controllers/userController.js'
import pool from '../config/db.js' // Не забудь импортировать pool для запроса заказов

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

const uploadsPath = path.join(__dirname, '../../uploads')

console.log('📂 Serving static files from:', uploadsPath)

// Раздаем файлы по адресу /uploads/...
router.use('/uploads', express.static(uploadsPath))

router.post('/auth/register', userController.register)
router.post('/auth/login', userController.login)

// --- ЗАЩИЩЕННЫЕ РОУТЫ ---
router.use(authMiddleware)
router.get('/cart', orderController.getCart)
router.post('/cart/items', orderController.addToCart)
router.delete('/cart/items/:itemId', orderController.removeFromCart)

router.post('/orders/checkout', orderController.checkout)

router.get('/orders/my', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id])
		res.json(result.rows)
	} catch (e) {
		console.error(e)
		res.status(500).json({ error: 'Ошибка при получении заказов' })
	}
})
router.get('/users/me', userController.getMe)
router.patch('/users/me', userController.updateProfile)
router.post('/users/me/avatar', userController.upload.single('avatar'), userController.uploadAvatar)

// --- PRODUCTS ---
router.get('/products', productController.getProducts)
router.get('/products/featured', productController.getFeaturedProducts)
router.get('/products/:id', productController.getProductById)

// --- ADMIN PRODUCTS ---
router.get('/admin/products', productController.getAllProductsAdmin)
router.post('/admin/products', productController.createProduct)
router.put('/admin/products/:id', productController.updateProduct)
router.delete('/admin/products/:id', productController.deleteProduct)

// --- CART & ORDERS ---


export default router