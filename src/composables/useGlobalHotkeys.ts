// src/composables/useGlobalHotkeys.ts
import { onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useMessagesStore } from '@/stores/messages'
import { useModalStore } from '@/stores/appModal'
import { globalHotkeyRegistry } from '@/services/plugins/HotkeyRegistry'
interface KeyBindingValue {
	key: string
	ctrl?: boolean
	shift?: boolean
	alt?: boolean
	meta?: boolean
}
const SPECIAL_KEY_CODES: Record<string, string> = {
	arrowup: 'ArrowUp',
	arrowdown: 'ArrowDown',
	arrowleft: 'ArrowLeft',
	arrowright: 'ArrowRight',
	escape: 'Escape',
	enter: 'Enter',
	space: 'Space'
}

let activeListenersCount = 0
let globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null
let nativeHotkeysRegistered = false

const isKeyMatch = (e: KeyboardEvent, targetKey: string): boolean => {
	if (!targetKey) return false
	const k = targetKey.toLowerCase()

	if (e.key.toLowerCase() === k) return true
	if (/^[a-z]$/.test(k) && e.code.toLowerCase() === `key${k}`) return true
	if (/^[0-9]$/.test(k) && e.code.toLowerCase() === `digit${k}`) return true

	const mappedCode = SPECIAL_KEY_CODES[k]
	if (mappedCode && e.code.toLowerCase() === mappedCode.toLowerCase()) {
		return true
	}

	return false
}

// 🌟 Регистрация базовых хоткеев ядра
const registerNativeHotkeys = () => {
	if (nativeHotkeysRegistered) return

	const modal = useModalStore()
	const messagesStore = useMessagesStore()

	globalHotkeyRegistry.register({
		action: 'toggle_settings',
		label: 'Открыть настройки',
		key: ',',
		ctrl: true,
		callback: () => modal.toggle('settings')
	})

	globalHotkeyRegistry.register({
		action: 'toggle_editor',
		label: 'Открыть / скрыть редактор заметок',
		key: 'e',
		alt: true,
		callback: () => modal.toggle('Editor')
	})

	globalHotkeyRegistry.register({
		action: 'close_modal',
		label: 'Закрыть модальное окно',
		key: 'Escape',
		callback: () => {
			modal.close()
			messagesStore.isEditorOpen = false
		}
	})

	globalHotkeyRegistry.register({
		action: 'toggle_search',
		label: 'Глобальный поиск',
		key: 'f',
		shift: true,
		callback: () => modal.toggle('global-search')
	})

	nativeHotkeysRegistered = true
}

export function useGlobalHotkeys() {
	const settingsStore = useSettingsStore()

	// Регистрация нативных хоткеев при первом вызове композабла
	registerNativeHotkeys()

	const getBindingFor = (def: {
		action: string
		key: string
		ctrl?: boolean
		shift?: boolean
		alt?: boolean
	}): KeyBindingValue => {
		const storeValues = (settingsStore.values ?? {}) as Record<string, unknown>
		// Проверяем кастомную настройку пользователя из store
		const rawFromValues =
			storeValues[`hk_${def.action}`] ?? storeValues[def.action]

		if (
			typeof rawFromValues === 'object' &&
			rawFromValues !== null &&
			'key' in rawFromValues
		) {
			return rawFromValues as KeyBindingValue
		}

		return {
			key: def.key,
			ctrl: !!def.ctrl,
			shift: !!def.shift,
			alt: !!def.alt
		}
	}

	const handleKeydown = (e: KeyboardEvent) => {
		if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

		const allHotkeys = globalHotkeyRegistry.getAll()

		for (const def of allHotkeys) {
			const binding = getBindingFor(def)

			const matchKey = isKeyMatch(e, binding.key)
			const matchCtrl = !!binding.ctrl === (e.ctrlKey || e.metaKey)
			const matchShift = !!binding.shift === e.shiftKey
			const matchAlt = !!binding.alt === e.altKey

			if (matchKey && matchCtrl && matchShift && matchAlt) {
				e.preventDefault()
				e.stopPropagation()
				console.log(`[Hotkeys] Сработало действие: ${def.action}`)
				def.callback() // 🌟 Вызов динамического коллбэка
				return
			}
		}

		// Дополнительные жесткие системные шорткаты можно оставить тут, если они не должны переназначаться
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyE') {
			e.preventDefault()
			e.stopPropagation()
			globalHotkeyRegistry.get('toggle_editor')?.callback()
			return
		}

		if (
			(e.ctrlKey || e.metaKey) &&
			(e.code === 'KeyK' || e.key.toLowerCase() === 'k')
		) {
			e.preventDefault()
			e.stopPropagation()
			globalHotkeyRegistry.get('toggle_search')?.callback()
			return
		}
	}

	onMounted(() => {
		if (activeListenersCount === 0) {
			globalKeydownHandler = handleKeydown
			window.addEventListener('keydown', globalKeydownHandler, {
				capture: true
			})
		}
		activeListenersCount++
	})

	onUnmounted(() => {
		activeListenersCount = Math.max(0, activeListenersCount - 1)
		if (activeListenersCount === 0 && globalKeydownHandler) {
			window.removeEventListener('keydown', globalKeydownHandler, {
				capture: true
			})
			globalKeydownHandler = null
		}
	})
}
