import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'appTheme'

function load(): Record<string, string> {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
	} catch {
		return {}
	}
}

export const useThemeStore = defineStore('theme', () => {
	// ключ = имя CSS-переменной, например '--color-accent'
	const overrides = ref<Record<string, string>>(load())
	let applied: string[] = []

	function applyToRoot() {
		const root = document.documentElement
		// убираем переменные, которые сбросили
		for (const key of applied) {
			if (!(key in overrides.value)) root.style.removeProperty(key)
		}
		for (const [key, value] of Object.entries(overrides.value)) {
			root.style.setProperty(key, value)
		}
		applied = Object.keys(overrides.value)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides.value))
		} catch {
			/* localStorage недоступен: не сохраняем */
		}
	}

	watch(overrides, applyToRoot, { immediate: true, deep: true })

	// theme.setVar('--color-accent', '#f43f5e')
	function setVar(name: string, value: string) {
		overrides.value = { ...overrides.value, [name]: value }
	}

	function setVars(patch: Record<string, string>) {
		overrides.value = { ...overrides.value, ...patch }
	}

	function resetVar(name: string) {
		const { [name]: _, ...rest } = overrides.value
		overrides.value = rest
	}

	function resetTheme() {
		overrides.value = {}
	}

	// Текущее значение (из CSS или из переопределения), удобно для color picker в настройках
	function getVar(name: string): string {
		return getComputedStyle(document.documentElement)
			.getPropertyValue(name)
			.trim()
	}

	return { overrides, setVar, setVars, resetVar, resetTheme, getVar }
})
