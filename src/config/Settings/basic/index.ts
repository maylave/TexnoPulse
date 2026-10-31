// src/config/networkSettings.ts (или внутри вашего baseSettings.ts)
import type { SettingDefinition } from '@/types/settings'
import UiNumberInput from '@/components/ui/UiNumberInput.vue'
import UiServerStatus from '@/components/modals/settings/UiServerStatus.vue' // <-- Ваш новый компонент статуса
import { RefreshCw } from 'lucide-vue-next'
import { api } from '@/api/client'
import { TAB } from '../shared' // Ваши константы вкладок

export const networkSettings: SettingDefinition[] = [
	{
		id: 'server_port',
		label: 'Порт сервера',
		description: 'Управление портом бэкенда и автоматическим определением',
		type: 'input',
		component: UiNumberInput,
		defaultValue: 3000,
		category: 'network', // Привязка к вкладке Сеть
		group: 'Подключение',
		placeholder: '3000',
		range: { min: 1024, max: 65535, step: 1 },

		// 1. Подключаем компонент для вывода статуса соединения
		statusComponent: UiServerStatus,

		// 2. Описываем кнопки, которые отрендерит Settings.vue
		actions: [
			{
				label: 'Применить порт',
				primary: true,
				onClick: (currentValue, updateValue) => {
					const port = Number(currentValue)
					if (port >= 1024 && port <= 65535) {
						// Сохраняем в API
						api.setPort(port, true)
						// Принудительно обновляем стор (на случай если ввели строку)
						updateValue(port)
					}
				}
			},
			{
				label: 'Автопоиск',
				icon: RefreshCw,
				onClick: async (_, updateValue) => {
					try {
						const detected = await api.detectPort()
						// 1. Обновляем инпут и стор настроек через коллбэк
						updateValue(detected)
						// 2. Применяем порт в клиенте API
						api.setPort(detected, true)
					} catch (error) {
						console.error('Ошибка при поиске порта:', error)
					}
				}
			}
		]
	}
]
