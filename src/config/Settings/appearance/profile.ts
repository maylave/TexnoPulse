import type { SettingDefinition, SettingRange } from '@/types/settings'

import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'

import { G, color, PERCENT, TAB, stepped, PERCENT_CSS } from '../shared'
export const profileSettings: SettingDefinition[] = [
	// --- Профиль ---
	{
		id: 'username',
		label: 'Имя пользователя',
		description: 'Отображается в профиле и сообщениях',
		type: 'input',
		component: UiInput,
		defaultValue: 'User',
		category: TAB,
		group: G.profile,
		placeholder: 'Введите имя...'
	},
	{
		id: 'language',
		label: 'Язык интерфейса',
		description: 'Выберите язык для меню и подсказок',
		type: 'select',
		component: UiSelect,
		defaultValue: 'ru',
		category: TAB,
		group: G.profile,
		options: [
			{ value: 'ru', label: 'Русский' },
			{ value: 'en', label: 'English' },
			{ value: 'de', label: 'Deutsch' }
		]
	}
]
