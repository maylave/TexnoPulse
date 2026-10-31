import type { SettingDefinition, SettingRange } from '@/types/settings'
import UiColorPicker from '@/components/ui/UiColorPicker.vue'
import UiSteppedSlider from '@/components/ui/UiSteppedSlider.vue'
export const TAB = 'appearance'

export const G = {
	colors: 'Цвета интерфейса',
	header: 'Шапка чата',
	input: 'Поле ввода',
	glow: 'Рамка поля ввода',
	menu: 'Контекстное меню',
	sidebar: 'Сайдбар',
	layout: 'Сообщения',
	bubbles: 'Оформление сообщений',
	anim: 'Анимации',
	profile: 'Профиль'
} as const

export const color = (
	id: string,
	group: string,
	label: string,
	cssVar: string | string[],
	defaultValue: string,
	description?: string
): SettingDefinition => ({
	id,
	label,
	description,
	group,
	category: TAB,
	type: 'color-picker',
	component: UiColorPicker,
	defaultValue,
	css: { var: cssVar }
})

/** Слайдер с рисками, привязанный к CSS-переменной */
export const stepped = (
	id: string,
	group: string,
	label: string,
	cssVar: string,
	defaultValue: number,
	range: SettingRange,
	css: { unit?: string; scale?: number } = {},
	description?: string
): SettingDefinition => ({
	id,
	label,
	description,
	group,
	category: TAB,
	type: 'slider',
	component: UiSteppedSlider,
	defaultValue,
	range: { showLabels: true, ...range },
	css: { var: cssVar, ...css }
})

/** 0–100% с шагом 5; в CSS хранится как 0–1 */
export const PERCENT: SettingRange = {
	min: 0,
	max: 100,
	step: 5,
	unit: '%',
	majorEvery: 5
}
export const PERCENT_CSS = { scale: 0.01 }
