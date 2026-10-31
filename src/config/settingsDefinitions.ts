import type { SettingDefinition, SettingRange } from '@/types/settings'

import { appearanceSettings } from './Settings/appearance/index'
import { dictionarySettings } from './Settings/dictionary'
import { hotkeysSettings } from './Settings/hotkeys'
import { notificationsSettings } from './Settings/notifications'
import { networkSettings } from './Settings/basic'
export const SETTINGS_DEFINITIONS: SettingDefinition[] = [
	...appearanceSettings,
	...dictionarySettings,
	...hotkeysSettings,
	...notificationsSettings,
	...networkSettings
]
