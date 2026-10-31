import type { SettingDefinition, SettingRange } from '@/types/settings'
import UiToggle from '@/components/ui/UiToggle.vue'
import UiColorPicker from '@/components/ui/UiColorPicker.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiNumberInput from '@/components/ui/UiNumberInput.vue'
import UiSteppedSlider from '@/components/ui/UiSteppedSlider.vue'
import UiHotkeyRecorder from '@/components/ui/UiHotkeyRecorder.vue'
import UiBackgroundPicker from '@/components/ui/UiBackgroundPicker.vue'
import { G, color, PERCENT, TAB, stepped, PERCENT_CSS } from '../shared'
export const historySettings: SettingDefinition[] = [
	{
		id: 'history_bar_enabled',
		label: 'Навигатор истории',
		description:
			'Отображать индикаторы и всплывающее меню истории на правом краю экрана',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: 'appearance',
		group: 'Навигатор истории'
	},
	{
		id: 'history_bar_max_dashes',
		label: 'Количество черточек в свернутом виде',
		description: 'Ограничение количества индикаторов справа (по умолчанию 4-5)',
		type: 'slider',
		component: UiSteppedSlider,
		defaultValue: 5,
		category: 'appearance',
		group: 'Навигатор истории',
		range: { min: 3, max: 7, step: 1 }
	},
	{
		id: 'history_bar_opacity',
		label: 'Степень затемнения карточки',
		description: 'Прозрачность всплывающей карточки истории при наведении (%)',
		type: 'slider',
		component: UiSteppedSlider,
		defaultValue: 35,
		category: 'appearance',
		group: 'Навигатор истории',
		range: { min: 15, max: 75, step: 5 }
	}
]
