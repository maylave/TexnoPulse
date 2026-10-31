import type { SettingDefinition } from '@/types/settings'
import UiToggle from '@/components/ui/UiToggle.vue'
import { BellRing } from 'lucide-vue-next'
import { api } from '@/api/client'

export const notificationsSettings: SettingDefinition[] = [
	// --- Раздел "Уведомления" ---
	{
		id: 'notifications_enabled',
		label: 'Включить системные уведомления',
		description: 'Главный переключатель уведомлений на рабочем столе Windows',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'notifications',
		group: 'Основные настройки'
	},
	{
		id: 'notifications_sound',
		label: 'Звуковые сигналы',
		description: 'Воспроизводить системный звук при получении уведомления',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'notifications',
		group: 'Основные настройки',
		dependsOn: { settingId: 'notifications_enabled', value: true }
	},
	{
		id: 'notifications_startup',
		label: 'Оповещение при запуске',
		description:
			'Присылать уведомление один раз при включении программы, что Snapi работает в фоне',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'notifications',
		group: 'Виды уведомлений',
		dependsOn: { settingId: 'notifications_enabled', value: true }
	},
	{
		id: 'notifications_messages',
		label: 'Входящие сообщения',
		description:
			'Показывать уведомления при поступлении новых сообщений от собеседников',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'notifications',
		group: 'Виды уведомлений',
		dependsOn: { settingId: 'notifications_enabled', value: true }
	},
	{
		id: 'notifications_devices',
		label: 'События устройств и сети',
		description:
			'Оповещать об обнаружении и синхронизации доверенных устройств в локальной сети',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'notifications',
		group: 'Виды уведомлений',
		dependsOn: { settingId: 'notifications_enabled', value: true }
	},

	// --- НОВЫЙ БЛОК: Проверка уведомлений ---
	{
		id: 'test_notification',
		label: 'Проверка уведомлений',
		description:
			'Отправит тестовое системное оповещение на рабочий стол Windows со звуком',
		type: 'toggle', // Тип обязателен по интерфейсу, но он не будет рендериться, так как нет component
		defaultValue: false,
		category: 'notifications',
		group: 'Диагностика',
		dependsOn: { settingId: 'notifications_enabled', value: true },

		// Передаем кнопку прямо из конфига
		actions: [
			{
				label: 'Проверить',
				icon: BellRing,
				primary: true,
				onClick: async () => {
					try {
						await api.request('notification:test')
					} catch (err) {
						console.error('Ошибка тестового уведомления:', err)
						alert(
							'Ошибка при отправке уведомления. Убедитесь, что сервер запущен.'
						)
					}
				}
			}
		]
	}
]
