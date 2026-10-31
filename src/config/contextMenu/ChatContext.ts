import type { MenuActionItem } from '@/types/menu'
import { Plus, FolderPlus, Pencil, Trash2 } from 'lucide-vue-next'

export type ChatMenuContext = 'root' | 'folder' | 'node'

export interface ChatMenuHandlers {
	onEditNode: () => void
	onDeleteNode: () => void
	onCreateChat: () => void
	onCreateFolder: () => void
}

export function getChatMenuItems(
	handlers: ChatMenuHandlers,
	context: ChatMenuContext = 'root'
): MenuActionItem[] {
	const items: MenuActionItem[] = [
		{
			id: 'chatCreate',
			label: 'Создать чат',
			icon: Plus,
			action: handlers.onCreateChat
		}
	]

	// «Создать папку» — только в корне и в папках
	if (context === 'root' || context === 'folder') {
		items.push({
			id: 'folderCreate',
			label: 'Создать папку',
			icon: FolderPlus,
			action: handlers.onCreateFolder
		})
	}

	// «Редактировать» и «Удалить» — только для узла
	if (context === 'node') {
		items.push(
			{
				id: 'editNode',
				label: 'Редактировать',
				icon: Pencil,
				action: handlers.onEditNode
			},
			{
				id: 'deleteNode',
				label: 'Удалить',
				icon: Trash2,
				action: handlers.onDeleteNode
			}
		)
	}

	return items
}
