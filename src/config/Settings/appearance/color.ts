import type { SettingDefinition, SettingRange } from '@/types/settings'
import { G, color } from '../shared'

export const colorsSettings: SettingDefinition[] = [
	color(
		'accent_color',
		G.colors,
		'Акцентный цвет',
		'--color-accent',
		'#4ea8ff',
		'Основной цвет интерфейса для кнопок и активных элементов'
	),
	color(
		'app_background',
		G.colors,
		'Фон приложения',
		['--color-background', '--color-surface'],
		'#051424'
	),
	color(
		'panel_color',
		G.colors,
		'Цвет панелей',
		'--color-surface-container',
		'#122131',
		'Карточки, окна настроек, контекстное меню'
	),
	color(
		'text_primary',
		G.colors,
		'Основной текст',
		'--color-on-surface',
		'#d4e4fa'
	),
	color(
		'text_secondary',
		G.colors,
		'Второстепенный текст',
		'--color-on-surface-variant',
		'#c6c6cc'
	),
	color(
		'border_color',
		G.colors,
		'Цвет границ',
		'--glass-border-color',
		'#ffffff',
		'Тонкие обводки стеклянных элементов'
	),
	color('header_text', G.header, 'Текст шапки', '--header-text', '#d4e4fa'),
	color('header_icon', G.header, 'Иконки шапки', '--header-icon', '#c6c6cc'),
	color(
		'header_icon_active',
		G.header,
		'Активные иконки шапки',
		'--header-icon-active',
		'#4ea8ff'
	),

	// --- Поле ввода ---
	color(
		'input_bg_color',
		G.input,
		'Цвет поля ввода',
		'--input-bg-color',
		'#0f172a'
	),
	color('input_text', G.input, 'Текст в поле', '--input-text', '#d4e4fa'),
	color(
		'input_send_bg',
		G.input,
		'Цвет кнопки отправки',
		'--input-send-bg',
		'#4ea8ff'
	),
	color(
		'input_send_text',
		G.input,
		'Иконка кнопки отправки',
		'--input-send-text',
		'#ffffff'
	),

	// --- Рамка поля ввода ---
	color('input_glow', G.glow, 'Цвет рамки', '--input-glow', '#ffffff'),
	color(
		'input_glow_2',
		G.glow,
		'Второй цвет рамки',
		'--input-glow-2',
		'#ffffff',
		'Сделайте отличным от первого для двухцветной рамки'
	),
	color(
		'sidebar_bg_color',
		G.sidebar,
		'Цвет сайдбара',
		'--sidebar-bg-color',
		'#1a1b1e'
	)
]
