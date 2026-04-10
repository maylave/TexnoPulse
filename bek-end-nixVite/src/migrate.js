import pool from './config/db.js' // Путь к твоему конфигу DB

const addPasswordColumn = async () => {
	try {
		console.log('Проверка наличия колонки password_hash...')

		// Выполняем ALTER TABLE
		await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)')

		console.log('✅ Колонка password_hash успешно добавлена (или уже существовала).')
	} catch (err) {
		console.error('❌ Ошибка при миграции:', err.message)
	} finally {
		// Важно закрыть соединение с базой, чтобы скрипт завершился
		await pool.end()
	}
}

addPasswordColumn()