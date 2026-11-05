// src/types/message.ts

// 1. Делаем тип открытым: TypeScript подскажет базовые типы, но разрешит любые строки от плагинов
export type MessageContentType =
	| 'text'
	| 'file'
	| 'sticker'
	| 'color'
	| 'code'
	| 'image'
	| 'audio'
	| 'video'
	| 'checklist'
	| 'table'
	| 'divider'
	| (string & {}) // 🌟 Ключевой момент для расширяемости плагинами

export type TextVariant = 'normal' | 'h1' | 'h2' | 'quote'
export type TextAlign = 'left' | 'center' | 'right'
export type BlockHighlight =
	| 'none'
	| 'blue'
	| 'emerald'
	| 'amber'
	| 'rose'
	| 'violet'
	| 'slate'

export interface MessageContent {
	type: MessageContentType
	highlight?: BlockHighlight
}

export interface TextContent extends MessageContent {
	type: 'text'
	text: string
	variant?: TextVariant
	align?: TextAlign
}

export interface FileContent extends MessageContent {
	type: 'file'
	name: string
	size: string
	url?: string
	fileId?: string
}

export interface ColorContent extends MessageContent {
	type: 'color'
	value: string
	label?: string
}

export interface CodeContent extends MessageContent {
	type: 'code'
	language: string
	fileName: string
	code: string
}

export interface ImageContent extends MessageContent {
	type: 'image'
	url: string
	alt?: string
	fileId?: string
}

export interface AudioContent extends MessageContent {
	type: 'audio'
	url: string
	duration?: number
	fileId?: string
}

export interface VideoContent extends MessageContent {
	type: 'video'
	url: string
	thumbnail?: string
	fileId?: string
}

export interface ChecklistItem {
	id: string
	text: string
	isChecked: boolean
}

export interface ChecklistContent extends MessageContent {
	type: 'checklist'
	title?: string
	items: ChecklistItem[]
}

export interface TableContent extends MessageContent {
	type: 'table'
	rows: string[][]
}

export interface DividerContent extends MessageContent {
	type: 'divider'
}

export interface StickerContent extends MessageContent {
	type: 'sticker'
	url: string
}

// 🌟 Универсальный интерфейс для всех кастомных блоков из плагинов (canvas, poll, widget и т.д.)
export interface PluginContent extends MessageContent {
	[key: string]: any // Позволяет плагинам хранить любые payload-данные (nodes, options, votes)
}

// 2. Добавляем PluginContent в конец Union.
// Когда вынесете canvas и poll в плагины, их интерфейсы можно будет удалить отсюда.
export type AnyMessageContent =
	| TextContent
	| FileContent
	| StickerContent
	| ColorContent
	| CodeContent
	| ImageContent
	| AudioContent
	| VideoContent
	| ChecklistContent
	| TableContent
	| DividerContent
	| PluginContent // 🌟 Обработает любой незарегистрированный тип

export interface Message {
	id: string
	chatId: string
	content: AnyMessageContent[]
	timestamp: Date
	isOwn: boolean
	sender?: string
}
