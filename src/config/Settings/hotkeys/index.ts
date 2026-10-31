import type { SettingDefinition, SettingRange } from '@/types/settings'
import UiToggle from '@/components/ui/UiToggle.vue'

import UiHotkeyRecorder from '@/components/ui/UiHotkeyRecorder.vue'

export const hotkeysSettings: SettingDefinition[] = [
	// --- Вкладка: Горячие клавиши ---
	{
		id: 'global_hotkeys_enabled',
		label: 'Глобальные горячие клавиши',
		description: 'Работают даже когда приложение свернуто',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'hotkeys'
	},

	// --- Вкладка: Горячие клавиши ---
	{
		id: 'hk_toggle_settings',
		label: 'Открыть настройки',
		description: 'Быстрый доступ к этому окну',
		type: 'hotkey-recorder', // Новый тип
		component: UiHotkeyRecorder,
		defaultValue: { key: ',', ctrl: true },
		category: 'hotkeys',
		group: 'Управление интерфейсом'
	},
	{
		id: 'hk_close_modal',
		label: 'Закрыть окно / Модалку',
		description: 'Универсальная кнопка отмены',
		type: 'hotkey-recorder',
		component: UiHotkeyRecorder,
		defaultValue: { key: 'Escape' },
		category: 'hotkeys',
		group: 'Управление интерфейсом'
	},
	{
		id: 'hk_new_message',
		label: 'Новое сообщение',
		description: 'Создать черновик или начать чат',
		type: 'hotkey-recorder',
		component: UiHotkeyRecorder,
		defaultValue: { key: 'n', ctrl: true },
		category: 'hotkeys',
		group: 'Работа с чатом'
	}
]
