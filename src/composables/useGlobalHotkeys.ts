// src/composables/useGlobalHotkeys.ts
import { onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useMessagesStore } from '@/stores/messages'
import { useModalStore } from '@/stores/appModal'
import { DEFAULT_HOTKEYS } from '@/config/hotkeys'
import type { HotkeyAction, KeyBindingValue } from '@/types/hotkeys'

const SPECIAL_KEY_CODES: Record<string, string> = {
	arrowup: 'ArrowUp',
	arrowdown: 'ArrowDown',
	arrowleft: 'ArrowLeft',
	arrowright: 'ArrowRight',
	escape: 'Escape',
	enter: 'Enter',
	space: 'Space'
}

// Глобальный флаг, чтобы слушатель никогда не вешался дважды,
// даже если useGlobalHotkeys() вызвали в нескольких компонентах
let activeListenersCount = 0
let globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null

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

export function useGlobalHotkeys() {
	const settingsStore = useSettingsStore()
	const messagesStore = useMessagesStore()
	const modal = useModalStore()

	const executeAction = (action: HotkeyAction) => {
		console.log('[Hotkeys] Сработало действие:', action)

		switch (action) {
			case 'toggle_settings':
				modal.toggle('settings')
				break

			case 'toggle_editor':
				modal.toggle('Editor')
				break

			case 'close_modal':
				modal.close()
				messagesStore.isEditorOpen = false
				break
			case 'toggle_search':
				modal.toggle('global-search')
				break
		}
	}

	const getBindingFor = (
		def: (typeof DEFAULT_HOTKEYS)[number]
	): KeyBindingValue => {
		const storeValues = (settingsStore.values ?? {}) as Record<string, unknown>
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
			ctrl: def.ctrl,
			shift: def.shift,
			alt: def.alt
		}
	}

	const handleKeydown = (e: KeyboardEvent) => {
		// Игнорируем одиночные нажатия самих клавиш-модификаторов
		if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

		for (const def of DEFAULT_HOTKEYS) {
			const binding = getBindingFor(def)

			const matchKey = isKeyMatch(e, binding.key)
			const matchCtrl = !!binding.ctrl === (e.ctrlKey || e.metaKey)
			const matchShift = !!binding.shift === e.shiftKey
			const matchAlt = !!binding.alt === e.altKey

			if (matchKey && matchCtrl && matchShift && matchAlt) {
				e.preventDefault()
				e.stopPropagation()
				executeAction(def.action)
				return
			}
		}

		// Дополнительный встроенный шорткат: Ctrl + Shift + E тоже всегда открывает редактор
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyE') {
			e.preventDefault()
			e.stopPropagation()
			executeAction('toggle_editor')
			return
		}

		// Дополнительный встроенный шорткат: Ctrl + K / Cmd + K всегда открывает глобальный поиск
		if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyK' || e.key.toLowerCase() === 'k')) {
			e.preventDefault()
			e.stopPropagation()
			executeAction('toggle_search')
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
