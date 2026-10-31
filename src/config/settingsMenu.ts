// src/config/settingsMenu.ts
import {
	Palette,
	Keyboard,
	Info,
	Sparkles,
	Bell,
	Network
} from 'lucide-vue-next'
import type { SettingsMenuItem } from '@/types/settings'

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
	{ id: 'appearance', label: 'Внешний вид', icon: Palette },
	{ id: 'notifications', label: 'Уведомления', icon: Bell },
	{ id: 'network', label: 'Порт и сервер', icon: Network },
	{ id: 'hotkeys', label: 'Горячие клавиши', icon: Keyboard },
	{ id: 'dictionary', label: 'Подсказки и словарь', icon: Sparkles },

	{ id: 'about', label: 'О приложении', icon: Info }
]
