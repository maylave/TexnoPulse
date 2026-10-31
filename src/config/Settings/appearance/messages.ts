import type { SettingDefinition, SettingRange } from '@/types/settings'
import UiToggle from '@/components/ui/UiToggle.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { G, color, PERCENT, TAB, stepped, PERCENT_CSS } from '../shared'

export const messagesSettings: SettingDefinition[] = [
	color(
		'msg_bg_own',
		G.bubbles,
		'Цвет своих сообщений',
		'--msg-bg-own',
		'#1f3f5e'
	),
	color(
		'msg_text_own',
		G.bubbles,
		'Текст своих сообщений',
		'--msg-text-own',
		'#d4e4fa'
	),
	color(
		'msg_bg_other',
		G.bubbles,
		'Цвет чужих сообщений',
		'--msg-bg-other',
		'#1c2b3c'
	),
	color(
		'msg_text_other',
		G.bubbles,
		'Текст чужих сообщений',
		'--msg-text-other',
		'#d4e4fa'
	),
	stepped(
		'msg_radius',
		G.bubbles,
		'Скругление сообщений',
		'--msg-radius-base',
		16,
		{ min: 4, max: 28, step: 4, unit: 'px', majorEvery: 3 },
		{ unit: 'px' }
	),
	stepped(
		'msg_corner_radius',
		G.bubbles,
		'Острый уголок',
		'--msg-radius-corner',
		4,
		{ min: 0, max: 12, step: 2, unit: 'px', majorEvery: 3 },
		{ unit: 'px' },
		'0 уберёт «хвостик» у пузыря'
	),
	stepped(
		'msg_blur',
		G.bubbles,
		'Размытие фона (стекло)',
		'--msg-blur',
		16,
		{ min: 0, max: 32, step: 4, unit: 'px', majorEvery: 4 },
		{ unit: 'px' },
		'Заметно, когда за сообщением есть фоновая картинка'
	),
	stepped(
		'msg_max_width',
		G.bubbles,
		'Максимальная ширина',
		'--msg-max-width',
		85,
		{ min: 50, max: 100, step: 5, unit: '%', majorEvery: 5 },
		{ unit: '%' },
		'Доля ширины чата, которую может занять пузырь'
	),
	stepped(
		'msg_font_size',
		G.bubbles,
		'Размер текста в сообщениях',
		'--msg-font-size',
		14,
		{ min: 12, max: 20, step: 1, unit: 'px', majorEvery: 4 },
		{ unit: 'px' }
	),
	// --- Сообщения: раскладка ---
	{
		id: 'split_messages_by_sender',
		label: 'Разделять свои и чужие сообщения',
		description:
			'Свои справа, чужие слева. Выключите, чтобы все были с одной стороны',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: TAB,
		group: G.layout
	},
	{
		id: 'messages_side',
		label: 'Сторона сообщений',
		description: 'Все сообщения будут с выбранной стороны',
		type: 'select',
		component: UiSelect,
		defaultValue: 'left',
		category: TAB,
		group: G.layout,
		options: [
			{ value: 'left', label: 'Слева' },
			{ value: 'right', label: 'Справа' }
		],
		dependsOn: { settingId: 'split_messages_by_sender', value: false }
	}
]
