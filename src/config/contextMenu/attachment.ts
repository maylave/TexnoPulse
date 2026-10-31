import type { MenuActionItem, MenuVariant } from '@/types/menu'

export interface AttachmentMenuHandlers {
	onPickImage: () => void
	onPickFile: () => void
}

export function getAttachmentMenuItems(
	handlers: AttachmentMenuHandlers,
	variant?: MenuVariant
): MenuActionItem[] {
	const baseItems: MenuActionItem[] = [
		{
			id: 'image',
			label: 'Фото или видео',
			icon: '🖼️', // Используем эмодзи или импортируй иконку из lucide-vue-next
			action: handlers.onPickImage,
			// Если variant === 'compact', явно указываем это.
			// Иначе оставляем undefined (виден везде)
			variant: variant === 'compact' ? 'compact' : undefined
		},
		{
			id: 'file',
			label: 'Файл',
			icon: '📎',
			action: handlers.onPickFile,
			variant: variant === 'compact' ? 'compact' : undefined
		}
	]

	// Если мы хотим, чтобы в ПОЛНОМ меню были дополнительные опции,
	// которые НЕ видны в компактном, добавляем их здесь без флага variant
	if (variant !== 'compact') {
		baseItems.push({
			id: 'camera',
			label: 'Камера',
			icon: '📷',
			action: () => console.log('Open camera')
			// Нет поля variant -> видно только в full режиме (так как в compact фильтруются только те, у кого variant==='compact'?
			// Стоп, логика фильтрации в компоненте была: "Если нет variant - видно везде".
			// Давай изменим подход для большей гибкости:
		})
	}

	return baseItems
}
