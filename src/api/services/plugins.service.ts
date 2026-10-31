import { httpClient } from './http.client'

export const pluginsService = {
	// 1. Получить список всех плагинов
	getAll: () => httpClient.get('/plugins'),

	// 2. Добавить новый плагин (FormData используется для загрузки файлов/архивов)
	upload: (formData: FormData) =>
		httpClient.post('/plugins/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		}),

	// 3. Скачать плагин по ID
	download: (id: number) =>
		httpClient.get(`/plugins/${id}/download`, {
			responseType: 'blob' // Критично для бинарных файлов (ZIP, tar.gz)
		}),

	// 4. Обновить статус (включить/выключить)
	toggle: (id: number, isActive: boolean) =>
		httpClient.patch(`/plugins/${id}/status`, { isActive }),

	// 5. Удалить плагин
	delete: (id: number) => httpClient.delete(`/plugins/${id}`)
}
