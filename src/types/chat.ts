// src/types/chat.ts
export type TypeNode = 'folder' | 'chat'

export interface BaseMeta {
	createdAt?: number
	updatedAt?: number
	isPinned?: boolean
	customIcon?: string
}

export interface FolderMeta {
	color?: string
	icon?: string
	collapsed?: boolean
	sortOrder?: 'date' | 'name' | 'manual'
}

export interface ChatMeta {
	avatarUrl: string
	/** id иконки из справочника, например "graduation-cap" */
	icon?: string
	/** Цвет иконки и фона кружка (HEX) */
	iconColor?: string
	backgroundUrl?: string
	unreadCount?: number
	lastMessagePreview?: string
	colorTheme?: string
}

export interface NodeMetadata {
	chat?: ChatMeta
	folder?: FolderMeta
	[key: string]: any
}

export interface AppNode {
	id: string
	label: string
	type: TypeNode
	metaDate: NodeMetadata
	parentId?: string | null
}
