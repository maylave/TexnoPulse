// src/services/plugins/HotkeyRegistry.ts
import { reactive } from 'vue'

export interface HotkeyDefinition {
	action: string // Уникальный ID действия (например, 'toggle_settings' или 'plugin_my_action')
	label: string // Описание для UI настроек
	key: string // Основная клавиша ('e', 'Escape', 'Enter')
	ctrl?: boolean
	shift?: boolean
	alt?: boolean
	meta?: boolean
	callback: () => void // Функция, которая вызовется при нажатии
}

class HotkeyRegistry {
	// Исправленная строка: generic передается в конструктор Map, а не в reactive
	private registry = reactive(new Map<string, HotkeyDefinition>())

	register(def: HotkeyDefinition) {
		this.registry.set(def.action, def)
		console.log(`[HotkeyRegistry] Зарегистрирован хоткей: ${def.action}`)
	}

	unregister(action: string) {
		this.registry.delete(action)
		console.log(`[HotkeyRegistry] Удален хоткей: ${action}`)
	}

	get(action: string): HotkeyDefinition | undefined {
		return this.registry.get(action)
	}

	getAll(): HotkeyDefinition[] {
		return Array.from(this.registry.values())
	}
}

// Экспортируем единственный экземпляр на всё приложение
export const globalHotkeyRegistry = new HotkeyRegistry()
