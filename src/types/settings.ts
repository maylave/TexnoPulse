// src/types/settings.ts
import type { Component } from 'vue'

export type ControlType =
	| 'slider'
	| 'toggle'
	| 'select'
	| 'color-picker'
	| 'input'
	| 'hotkey-recorder'
	| 'background-picker' // <-- Добавлен новый тип для записи хоткеев

/** Значение горячей клавиши */
export interface HotkeyValue {
	key: string
	ctrl?: boolean
	shift?: boolean
	alt?: boolean
}

/** Объединенный тип для значений любых настроек */
export type SettingValue = string | number | boolean | HotkeyValue

export interface SettingRange {
	min: number
	max: number
	step: number
	unit?: string
	/** Каждая N-я риска крупная (только для UiSteppedSlider) */
	majorEvery?: number
	/** Подписи под крупными рисками (только для UiSteppedSlider) */
	showLabels?: boolean
}

export interface SettingOption {
	value: string | number
	label: string
}

/** Привязка настройки к CSS-переменным темы */
export interface SettingCss {
	/** Имя переменной или список (одна настройка может менять несколько) */
	var: string | string[]
	/** Единица, которая дописывается к числу: "px", "s" */
	unit?: string
	/** Множитель: слайдер 0–100 (%) → в CSS 0–1 при scale = 0.01 */
	scale?: number
}

/** Описание кнопки-действия, которая рендерится рядом с настройкой */
export interface SettingAction {
	label: string
	icon?: Component
	/** Если true, кнопка будет выделена акцентным цветом */
	primary?: boolean
	/**
	 * Вызывается по клику на кнопку.
	 * Получает текущее значение настройки и функцию для его обновления в сторе.
	 */
	onClick: (
		currentValue: any,
		updateValue: (newVal: any) => void
	) => void | Promise<void>
}

export interface SettingDefinition {
	id: string
	label: string
	description?: string
	type: ControlType
	icon?: string
	defaultValue: SettingValue // <-- Поддерживает HotkeyValue
	category?: string // Связь с SettingsMenuItem.id

	component?: Component

	// -- Новые поля для Config-Driven UI --
	/** Вспомогательный компонент для вывода статуса (рендерится над инпутом) */
	statusComponent?: Component
	/** Кнопки, которые будут выведены рядом с полем ввода */
	actions?: SettingAction[]

	group?: string
	range?: SettingRange
	options?: SettingOption[]
	placeholder?: string
	css?: SettingCss
	dependsOn?: {
		settingId: string
		value: SettingValue
	}
}

export interface SettingsMenuItem {
	id: string
	label: string
	icon?: Component
}
