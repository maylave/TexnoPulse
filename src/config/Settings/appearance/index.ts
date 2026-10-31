import type { SettingDefinition, SettingRange } from '@/types/settings'
import { colorsSettings } from './color'
import { moreSettings } from './more'
import { steppedSettings } from './stepped'
import { animationsSettings } from './Animations'
import { sidebarSettings } from './Sidebar'
import { historySettings } from './history'
import { messagesSettings } from './messages'
import { profileSettings } from './profile'

export const appearanceSettings: SettingDefinition[] = [
	...colorsSettings,
	...moreSettings,
	...steppedSettings,
	...animationsSettings,
	...historySettings,
	...messagesSettings,
	...profileSettings,
	...sidebarSettings
]
