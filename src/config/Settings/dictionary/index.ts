import type { SettingDefinition, SettingRange } from '@/types/settings'
import UiToggle from '@/components/ui/UiToggle.vue'
import UiSteppedSlider from '@/components/ui/UiSteppedSlider.vue'

export const dictionarySettings: SettingDefinition[] = [
	// --- Раздел: Подсказки и словарь ---
	{
		id: 'autocomplete_enabled',
		label: 'Включить подсказки слов',
		description:
			'Показывать контекстное меню с частыми словами и сниппетами при вводе текста',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'dictionary',
		group: 'Параметры подсказок'
	},
	{
		id: 'autocomplete_learn_enabled',
		label: 'Запоминать частые слова',
		description:
			'Автоматически учитывать слова из отправленных сообщений и обучать словарь',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'dictionary',
		group: 'Параметры подсказок'
	},
	{
		id: 'autocomplete_code_enabled',
		label: 'Подсказки для кода',
		description:
			'Предлагать синтаксические конструкции и ключевые слова при наборе кода',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'dictionary',
		group: 'Параметры подсказок'
	},
	{
		id: 'autocomplete_min_chars',
		label: 'Минимум символов для поиска',
		description:
			'Количество набранных букв, после которого появляется меню подсказок',
		type: 'slider',
		component: UiSteppedSlider,
		defaultValue: 2,
		category: 'dictionary',
		group: 'Чувствительность',
		range: { min: 1, max: 4, step: 1 }
	},
	{
		id: 'autocomplete_max_items',
		label: 'Количество подсказок в меню',
		description: 'Сколько вариантов отображать во всплывающем меню',
		type: 'slider',
		component: UiSteppedSlider,
		defaultValue: 6,
		category: 'dictionary',
		group: 'Чувствительность',
		range: { min: 3, max: 10, step: 1 }
	}
]
