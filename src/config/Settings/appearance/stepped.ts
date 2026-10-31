import type { SettingDefinition, SettingRange } from '@/types/settings'

import { G, color, PERCENT, TAB, stepped, PERCENT_CSS } from '../shared'

export const steppedSettings: SettingDefinition[] = [
	stepped(
		'header_bg_opacity',
		G.header,
		'Плотность фона шапки',
		'--header-bg-opacity',
		40,
		PERCENT,
		PERCENT_CSS,
		'0% полностью прозрачный, 100% сплошной'
	),

	stepped(
		'input_bg_opacity',
		G.input,
		'Плотность фона поля',
		'--input-bg-opacity',
		45,
		PERCENT,
		PERCENT_CSS
	),

	stepped(
		'input_radius',
		G.input,
		'Скругление поля',
		'--input-radius',
		32,
		{ min: 8, max: 32, step: 4, unit: 'px', majorEvery: 3 },
		{ unit: 'px' }
	),
	stepped(
		'input_blur',
		G.input,
		'Размытие поля',
		'--input-blur',
		24,
		{ min: 0, max: 40, step: 4, unit: 'px', majorEvery: 5 },
		{ unit: 'px' }
	),

	stepped(
		'input_glow_width',
		G.glow,
		'Толщина рамки',
		'--input-glow-width',
		1.5,
		{ min: 0.5, max: 4, step: 0.5, unit: 'px' },
		{ unit: 'px' }
	),
	stepped(
		'input_glow_opacity',
		G.glow,
		'Яркость рамки',
		'--input-glow-opacity',
		100,
		{ min: 0, max: 100, step: 10, unit: '%', majorEvery: 5 },
		PERCENT_CSS,
		'0% полностью отключает рамку'
	),

	// --- Контекстное меню ---
	stepped(
		'menu_bg_opacity',
		G.menu,
		'Плотность фона меню',
		'--menu-bg-opacity',
		85,
		PERCENT,
		PERCENT_CSS
	),
	stepped(
		'menu_radius',
		G.menu,
		'Скругление меню',
		'--menu-radius',
		16,
		{ min: 4, max: 28, step: 4, unit: 'px', majorEvery: 3 },
		{ unit: 'px' }
	),
	stepped(
		'menu_blur',
		G.menu,
		'Размытие меню',
		'--menu-blur',
		20,
		{ min: 0, max: 40, step: 4, unit: 'px', majorEvery: 5 },
		{ unit: 'px' }
	)
]
