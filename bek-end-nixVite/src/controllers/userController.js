import bcrypt from 'bcryptjs'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/db.js'

// --- КОНФИГУРАЦИЯ JWT ---
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'
const TOKEN_EXPIRY = '7d' // Увеличил время жизни токена до 7 дней для удобства

const generateToken = (user) => {
	return jwt.sign(
		{ id: user.id, email: user.email },
		JWT_SECRET,
		{ expiresIn: TOKEN_EXPIRY }
	)
}

// --- НАСТРОЙКА ЗАГРУЗКИ ФАЙЛОВ (AVATAR) ---
const uploadDir = 'uploads/avatars'

// Создаем папку, если её нет
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir)
	},
	filename: (req, file, cb) => {
		// Уникальное имя файла: UUID + оригинальное расширение
		const uniqueSuffix = uuidv4() + path.extname(file.originalname)
		cb(null, uniqueSuffix)
	}
})

const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image/')) {
		cb(null, true)
	} else {
		cb(new Error('Разрешены только изображения!'), false)
	}
}

// Экспортируем настроенный инстанс multer для использования в роутах
export const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 } // Лимит 5MB
})

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ФОРМИРОВАНИЯ URL ---
// Бэкенд отдает относительный путь (/uploads/...), фронт собирает полный URL
const getFullAvatarUrl = (relativePath) => {
	if (!relativePath) return null
	// Убедись, что порт совпадает с твоим сервером
	return `http://localhost:3000${relativePath}`
}

// --- КОНТРОЛЛЕРЫ ---

export const getUsers = async (req, res) => {
	try {
		// Только для админов! В реальном проекте добавьте проверку роли
		const result = await pool.query('SELECT id, name, email, avatar_url FROM users')

		// Добавляем полные URL к аватаркам
		const usersWithAvatars = result.rows.map(user => ({
			...user,
			avatarUrl: getFullAvatarUrl(user.avatar_url)
		}))

		res.json(usersWithAvatars)
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при получении пользователей' })
	}
}

// ... (начало файла без изменений) ...

export const register = async (req, res) => {
	try {
		const { username, email, password } = req.body

		if (!username || !email || !password) {
			return res.status(400).json({ error: 'Все поля обязательны' })
		}

		const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email])
		if (existingUser.rows.length > 0) {
			return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
		}

		const salt = await bcrypt.genSalt(10)
		const passwordHash = await bcrypt.hash(password, salt)

		// ВАЖНО: Добавили role в INSERT, если хочешь задавать роль при регистрации. 
		// Или оставь как есть, если в БД стоит DEFAULT 'user'
		const result = await pool.query(
			'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, avatar_url',
			[username, email, passwordHash, 'user'] // По умолчанию роль user
		)

		const user = result.rows[0]
		const token = generateToken(user)

		res.status(201).json({
			message: 'Пользователь успешно зарегистрирован',
			user: {
				...user,
				role: user.role, // <--- ВОЗВРАЩАЕМ РОЛЬ
				avatarUrl: getFullAvatarUrl(user.avatar_url)
			},
			token
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({ error: 'Ошибка при регистрации' })
	}
}

export const login = async (req, res) => {
	try {
		const { login, password } = req.body

		if (!login || !password) {
			return res.status(400).json({ error: 'Email и пароль обязательны' })
		}

		// ВАЖНО: Выбираем role из базы
		const result = await pool.query('SELECT * FROM users WHERE email = $1', [login])
		const user = result.rows[0]

		if (!user) {
			return res.status(400).json({ error: 'Неверный email или пароль' })
		}

		const isMatch = await bcrypt.compare(password, user.password_hash)

		if (!isMatch) {
			return res.status(400).json({ error: 'Неверный email или пароль' })
		}

		const token = generateToken(user)
		const { password_hash, ...userWithoutPassword } = user

		res.json({
			message: 'Успешный вход',
			user: {
				...userWithoutPassword,
				role: user.role, // <--- ВОЗВРАЩАЕМ РОЛЬ
				avatarUrl: getFullAvatarUrl(userWithoutPassword.avatar_url)
			},
			token
		})
	} catch (err) {
		console.error('[LOGIN ERROR]', err)
		res.status(500).json({ error: 'Ошибка при входе' })
	}
}

export const getMe = async (req, res) => {
	try {
		const userId = req.user.id

		// ВАЖНО: Выбираем role из базы
		const result = await pool.query(
			'SELECT id, name, email, role, avatar_url FROM users WHERE id = $1',
			[userId]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Пользователь не найден' })
		}

		const user = result.rows[0]

		res.json({
			...user,
			role: user.role, // <--- ВОЗВРАЩАЕМ РОЛЬ
			avatarUrl: getFullAvatarUrl(user.avatar_url)
		})
	} catch (err) {
		console.error('[GET ME ERROR]', err)
		res.status(500).json({ error: 'Ошибка при получении профиля' })
	}
}

// ... (остальной код без изменений) ...
export const uploadAvatar = async (req, res) => {
	try {
		// 1. Проверяем, пришел ли файл
		if (!req.file) {
			return res.status(400).json({ error: 'Файл не загружен' })
		}

		const userId = req.user.id
		const fileName = req.file.filename
		const relativePath = `/api/uploads/avatars/${fileName}`

		// 2. Принудительно создаем папку, если её нет (на всякий случай)
		const uploadDir = path.join(process.cwd(), 'uploads', 'avatars')
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true })
		}


		try {
			const oldUser = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId])
			const oldAvatarPath = oldUser.rows[0]?.avatar_url

			if (oldAvatarPath) {

				const absoluteOldPath = path.join(process.cwd(), oldAvatarPath.replace(/^\//, ''))

				if (fs.existsSync(absoluteOldPath)) {
					fs.unlinkSync(absoluteOldPath)
					console.log(`Deleted old avatar: ${absoluteOldPath}`)
				}
			}
		} catch (deleteErr) {
			console.warn('Could not delete old avatar:', deleteErr.message)
			// Не прерываем выполнение, если удаление не удалось
		}


		await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [relativePath, userId])


		const fullUrl = `http://localhost:3000${relativePath}`

		res.json({
			message: 'Аватар успешно обновлен',
			avatarUrl: fullUrl
		})

	} catch (err) {
		console.error('[UPLOAD AVATAR ERROR]', err)
		res.status(500).json({
			error: 'Ошибка сервера при загрузке аватара',
			details: err.message // Для отладки можно убрать в продакшене
		})
	}
}

// --- ОБНОВЛЕНИЕ ДАННЫХ ПРОФИЛЯ (Имя, Email) ---
export const updateProfile = async (req, res) => {
	try {
		const userId = req.user.id
		const { name, email } = req.body

		// Простая проверка, чтобы не оставить поля пустыми
		if (!name || !email) {
			return res.status(400).json({ error: 'Имя и Email обязательны' })
		}

		const result = await pool.query(
			'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, avatar_url',
			[name, email, userId]
		)

		if (result.rows.length === 0) {
			return res.status(404).json({ error: 'Пользователь не найден' })
		}

		const user = result.rows[0]
		res.json({
			...user,
			avatarUrl: getFullAvatarUrl(user.avatar_url)
		})

	} catch (err) {
		console.error(err)
		// Обработка ошибки уникальности email, если такой уже есть у другого юзера
		if (err.code === '23505') {
			return res.status(400).json({ error: 'Этот email уже занят другим пользователем' })
		}
		res.status(500).json({ error: 'Ошибка при обновлении профиля' })
	}
}

// --- MIDDLEWARE ДЛЯ ЗАЩИТЫ РОУТОВ ---
export const authMiddleware = (req, res, next) => {
	const authHeader = req.header('Authorization')

	if (!authHeader) {
		return res.status(401).json({ error: 'Доступ запрещен. Нет токена.' })
	}

	const token = authHeader.replace('Bearer ', '')

	try {
		const decoded = jwt.verify(token, JWT_SECRET)
		req.user = decoded // Добавляем { id, email } в объект запроса
		next()
	} catch (err) {
		res.status(401).json({ error: 'Невалидный токен' })
	}
}

// --- ЭКСПОРТ ВСЕГО ---
export default {
	getUsers,
	register,
	login,
	uploadAvatar,
	getMe,
	updateProfile,
	authMiddleware,
	upload // Экспортируем сам инстанс multer для использования в роутах
}