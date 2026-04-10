import dotenv from 'dotenv'
import pkg from 'pg'

dotenv.config()

const { Pool } = pkg

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
})


pool.connect((err, client, release) => {
	if (err) {
		console.error('❌ Ошибка подключения к PostgreSQL:', err.stack)

		process.exit(1)
	} else {
		console.log('✅ Успешное подключение к базе данных:', process.env.DB_NAME)
		release()
	}
})

export default pool