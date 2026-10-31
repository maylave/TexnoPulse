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
export const moreSettings: SettingDefinition[] = [
	{
		id: 'chat_background',
		label: 'Фон приложения',
		description: 'Выберите готовый фон или добавьте свой',
		type: 'background-picker',
		component: UiBackgroundPicker,
		defaultValue: null,
		category: TAB,
		group: 'Фон'
	},

	{
		id: 'enable_attachment_picker',
		label: 'Большое меню вложений',
		description: 'Квадратная панель выбора файлов вместо обычного списка',
		type: 'toggle',
		component: UiToggle,
		defaultValue: true,
		category: TAB,
		group: 'Поле ввода'
	}
]
