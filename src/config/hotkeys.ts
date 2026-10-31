// src/config/hotkeys.ts

export type HotkeyAction =
	| 'toggle_settings'
	| 'toggle_editor'
	| 'close_modal'
	| 'new_message'
	| 'search'
	| 'toggle_search'

export interface HotkeyBinding {
	action: HotkeyAction
	key: string
	ctrl?: boolean
	shift?: boolean
	alt?: boolean
	meta?: boolean
	label: string
}

export const DEFAULT_HOTKEYS: HotkeyBinding[] = [
	{
		action: 'toggle_settings',
		key: ',',
		ctrl: true,
		label: 'Открыть настройки'
	},
	{
		action: 'toggle_editor',
		key: 'e',
		alt: true,
		label: 'Открыть / скрыть редактор заметок'
	},
	{
		action: 'close_modal',
		key: 'Escape',
		label: 'Закрыть модальное окно'
	},
	{
		action: 'toggle_search',
		key: 'f',
		shift: true,
		label: 'Закрыть модальное окно'
	}
]
