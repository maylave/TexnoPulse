import cors from 'cors'
import express from 'express'
import pool from './config/db.js'
import index from './routes/index.js'
const app = express()

app.use(express.json())

app.use(cors({
	origin: 'http://localhost:5173', // Или '*' для тестов, но лучше указать конкретный порт Vite
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use('/api', index)
pool.query('SELECT NOW()', (err, res) => {
	if (err) {
		console.error('Error connecting to the database', err.stack)
	} else {

	}
})

const PORT = 3000

const server = app.listen(PORT, () => {
	console.log(` Сервер успешно запущен на http://localhost:${PORT}`)

})
