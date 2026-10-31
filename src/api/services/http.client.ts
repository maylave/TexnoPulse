import axios from 'axios'

export const httpClient = axios.create({
	// Укажи здесь URL своего бэкенда
	baseURL: 'http://localhost:3000/api',
	headers: {
		'Content-Type': 'application/json'
	}
})

// Опционально: перехватчик для добавления токена авторизации
httpClient.interceptors.request.use(config => {
	const token = localStorage.getItem('token')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})
