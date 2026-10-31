import type { SettingDefinition, SettingRange } from '@/types/settings'
import UiToggle from '@/components/ui/UiToggle.vue'

import { G, color, PERCENT, TAB, stepped, PERCENT_CSS } from '../shared'

export const animationsSettings: SettingDefinition[] = [
	// --- Анимации ---
	{
		id: 'animations_enabled',
		label: 'Анимации интерфейса',
		description: 'Плавные переходы между экранами и модалками',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: TAB,
		group: G.anim
	},
	stepped(
		'anim_duration',
		G.anim,
		'Длительность анимаций',
		'--anim-scale',
		100,
		{ min: 50, max: 200, step: 25, unit: '%', majorEvery: 2 },
		PERCENT_CSS,
		'Меньше — быстрее, больше — медленнее. Действует на меню, шапку и вложения'
	),
	stepped(
		'input_glow_speed',
		G.anim,
		'Оборот рамки поля ввода',
		'--input-glow-speed',
		4,
		{ min: 1, max: 10, step: 1, unit: ' с' },
		{ unit: 's' },
		'Время одного оборота: меньше — быстрее'
	)
]
