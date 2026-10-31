// src/types/background.ts
export interface ChatBackground {
	id: string
	name: string
	type: 'solid' | 'gradient' | 'pattern' | 'image'
	value: string
	preview: string
	/** true — фон добавлен пользователем (можно удалять, сохраняется) */
	custom?: boolean
	/** id оригинального файла в IndexedDB (для загруженных с компьютера) */
	blobId?: string
}
