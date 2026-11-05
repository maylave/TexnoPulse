// src/types/plugin.ts

export type PluginType =
	| 'message-block'
	| 'widget'
	| 'theme'
	| 'system'
	| (string & {})

/**
 * Разделение стилей на глобальные (для всего приложения)
 * и локальные (только для конкретного HTML-шаблона плагина)
 */
export interface PluginStyles {
	global?: string
	scoped?: string
}

/**
 * Исполняемая часть плагина (эквивалент .vue файла)
 */
export interface PluginComponent {
	html?: string // Vue-шаблон (в виде строки) или чистый HTML
	script?: string // JS/TS логика (состояние, функции, обработчики)
	styles?: PluginStyles
}

/**
 * Универсальный манифест плагина
 */
export interface UniversalPlugin {
	id: string
	name: string
	version: string
	type: PluginType
	author?: string
	description?: string

	component?: PluginComponent

	installScript?: string
	uninstallScript?: string

	isActive?: boolean
}
