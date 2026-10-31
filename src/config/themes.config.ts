// src/config/themes.config.ts

export interface ThemeConfig {
	id: string
	name: string
	type: 'dark' | 'light'
	colorHint: string // Цвет кружочка-подсказки в интерфейсе
	vars: Record<string, string>
}

export const predefinedThemes: Record<string, ThemeConfig> = {
	aether: {
		id: 'aether',
		name: 'Aether (По умолчанию)',
		type: 'dark',
		colorHint: '#4ea8ff',
		vars: {
			// Чтобы сбросить к дефолту, можно передать пустой объект,
			// но для надежности переопределим основные цвета:
			'--color-background': '#051424',
			'--color-surface': '#051424',
			'--color-surface-container': '#122131',
			'--color-surface-container-highest': '#273647',
			'--color-on-surface': '#d4e4fa',
			'--color-on-surface-variant': '#c6c6cc',
			'--color-accent': '#4ea8ff',
			'--glass-border-color': '#ffffff',
			'--glass-border-opacity': '0.1',
			'--editor-overlay-bg': 'rgba(3, 10, 20, 0.78)'
		}
	},
	paper: {
		id: 'paper',
		name: 'Paper (Светлая)',
		type: 'light',
		colorHint: '#2563eb',
		vars: {
			'--color-background': '#f8fafc',
			'--color-surface': '#ffffff',
			'--color-surface-container': '#f1f5f9',
			'--color-surface-container-lowest': '#ffffff',
			'--color-surface-container-highest': '#e2e8f0',
			'--color-on-surface': '#0f172a',
			'--color-on-surface-variant': '#475569',
			'--color-accent': '#2563eb', // Синий акцент для светлой темы
			'--glass-border-color': '#000000',
			'--glass-border-opacity': '0.08',
			'--editor-overlay-bg': 'rgba(255, 255, 255, 0.6)'
		}
	},
	obsidian: {
		id: 'obsidian',
		name: 'Obsidian (Графит)',
		type: 'dark',
		colorHint: '#a78bfa', // Фиолетовый акцент
		vars: {
			'--color-background': '#0d1117',
			'--color-surface': '#161b22',
			'--color-surface-container': '#21262d',
			'--color-surface-container-lowest': '#010409',
			'--color-surface-container-highest': '#30363d',
			'--color-on-surface': '#c9d1d9',
			'--color-on-surface-variant': '#8b949e',
			'--color-accent': '#a78bfa',
			'--glass-border-color': '#ffffff',
			'--glass-border-opacity': '0.08',
			'--editor-overlay-bg': 'rgba(13, 17, 23, 0.8)'
		}
	}
}
