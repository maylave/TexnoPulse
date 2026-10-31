// src/stores/plugins.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pluginsService } from '@/api/services/plugins.service'

export const usePluginStore = defineStore('plugins', () => {
	const plugins = ref<any[]>([])
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	const fetchPlugins = async () => {
		isLoading.value = true
		error.value = null
		try {
			const response = await pluginsService.getAll()
			// Если бэкенд возвращает только ID иконок, здесь можно сделать .map()
			// и сопоставить их с реальными компонентами Lucide.
			plugins.value = response.data
		} catch (e) {
			console.error('Ошибка загрузки плагинов:', e)
			error.value = 'Не удалось загрузить плагины'
		} finally {
			isLoading.value = false
		}
	}

	const togglePlugin = async (id: number, status: boolean) => {
		const plugin = plugins.value.find(p => p.id === id)
		if (!plugin) return

		// Оптимистичное обновление UI
		plugin.isActive = status

		try {
			await pluginsService.toggle(id, status)
		} catch (e) {
			console.error('Ошибка при обновлении статуса:', e)
			// Откатываем статус назад при ошибке сервера
			plugin.isActive = !status
			error.value = 'Не удалось изменить статус'
		}
	}

	return {
		plugins,
		isLoading,
		error,
		fetchPlugins,
		togglePlugin
	}
})
