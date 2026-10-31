import type { SettingDefinition, SettingRange } from '@/types/settings'
import UiToggle from '@/components/ui/UiToggle.vue'

import UiNumberInput from '@/components/ui/UiNumberInput.vue'

import { G, PERCENT, TAB, stepped, PERCENT_CSS } from '../shared'

export const sidebarSettings: SettingDefinition[] = [
	// --- Сайдбар ---
	{
		id: 'sidebar_width',
		label: 'Ширина сайдбара',
		description: 'Точное значение в пикселях',
		type: 'input',
		component: UiNumberInput,
		defaultValue: 280,
		category: TAB,
		group: G.sidebar,
		range: { min: 200, max: 400, step: 10 },
		css: { var: '--sidebar-width', unit: 'px' }
	},

	stepped(
		'sidebar_bg_opacity',
		G.sidebar,
		'Плотность фона сайдбара',
		'--sidebar-bg-opacity',
		40,
		PERCENT,
		PERCENT_CSS
	),
	stepped(
		'sidebar_item_radius',
		G.sidebar,
		'Скругление пунктов',
		'--sidebar-item-radius',
		8,
		{ min: 0, max: 16, step: 2, unit: 'px', majorEvery: 4 },
		{ unit: 'px' }
	)
]
