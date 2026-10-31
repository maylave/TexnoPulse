// src/stores/background.ts
import type { ChatBackground } from '@/types/background'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { putImage, getImage, deleteImage } from '@/utils/backgroundDb'

const SELECTED_KEY = 'chat-background-id'
const CUSTOM_KEY = 'chat-custom-backgrounds'

const BUILTIN_BACKGROUNDS: ChatBackground[] = [
	{
		id: 'default',
		name: 'Тёмный',
		type: 'solid',
		value: '#1e293b',
		preview: 'bg-slate-800'
	},
	{
		id: 'light',
		name: 'Светлый',
		type: 'solid',
		value: '#f8fafc',
		preview: 'bg-slate-50'
	},
	{
		id: 'gradient-blue-purple',
		name: 'Сине-фиолетовый',
		type: 'gradient',
		value: 'from-blue-500 to-purple-600',
		preview: 'bg-gradient-to-br from-blue-500 to-purple-600'
	},
	{
		id: 'gradient-green-teal',
		name: 'Зелёно-бирюзовый',
		type: 'gradient',
		value: 'from-green-500 to-teal-600',
		preview: 'bg-gradient-to-br from-green-500 to-teal-600'
	},
	{
		id: 'pattern-dots',
		name: 'Точки',
		type: 'pattern',
		value: 'radial-gradient(circle, #475569 1px, transparent 1px)',
		preview: 'bg-[radial-gradient(circle,#475569_1px,transparent_1px)]'
	},
	{
		id: 'temp-image-url',
		name: 'Астронавт',
		type: 'image',
		value:
			'https://images.wallpaperscraft.ru/image/single/astronavt_skafandr_otrazhenie_144426_3840x2160.jpg',
		preview:
			'https://images.wallpaperscraft.ru/image/single/astronavt_skafandr_otrazhenie_144426_3840x2160.jpg'
	}
]

function readCustom(): ChatBackground[] {
	try {
		const raw = localStorage.getItem(CUSTOM_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed)
			? parsed.map((b: ChatBackground) => ({ ...b, custom: true }))
			: []
	} catch {
		return []
	}
}

export const useBackgroundStore = defineStore('background', () => {
	const currentBackgroundId = ref<string>('default')

	const backgrounds = ref<ChatBackground[]>([
		...BUILTIN_BACKGROUNDS,
		...readCustom()
	])

	const currentBackground = computed((): ChatBackground => {
		const bg = backgrounds.value.find(b => b.id === currentBackgroundId.value)
		return bg || backgrounds.value[0]!
	})

	const availableBackgrounds = computed(() => backgrounds.value)
	const customBackgrounds = computed(() =>
		backgrounds.value.filter(b => b.custom)
	)

	const backgroundStyle = computed(() => {
		const bg = currentBackground.value

		switch (bg.type) {
			case 'solid':
				return { backgroundColor: bg.value }
			case 'gradient':
				return {
					backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`
				}
			case 'pattern':
				return { backgroundImage: bg.value, backgroundSize: '20px 20px' }
			case 'image':
				// Пока файл из IndexedDB ещё читается, value пустой
				if (!bg.value) return {}
				return {
					backgroundImage: `url(${bg.value})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat'
				}
			default:
				return {}
		}
	})

	/** В localStorage идут только метаданные: у файлов вместо картинки лежит blobId */
	const persistCustom = (): boolean => {
		try {
			const data = customBackgrounds.value.map(b =>
				b.blobId ? { ...b, value: '', preview: '' } : b
			)
			localStorage.setItem(CUSTOM_KEY, JSON.stringify(data))
			return true
		} catch {
			return false
		}
	}

	const setBackground = (backgroundId: string) => {
		const bg = backgrounds.value.find(b => b.id === backgroundId)
		if (bg) {
			currentBackgroundId.value = backgroundId
			localStorage.setItem(SELECTED_KEY, backgroundId)
		}
	}

	/** Для цвета и ссылки */
	const addBackground = (
		background: Omit<ChatBackground, 'id' | 'custom' | 'blobId'>
	): boolean => {
		const bg: ChatBackground = {
			...background,
			id: `custom-${crypto.randomUUID()}`,
			custom: true
		}
		backgrounds.value.push(bg)

		if (!persistCustom()) {
			backgrounds.value.pop()
			return false
		}
		setBackground(bg.id)
		return true
	}

	/** Для файла с компьютера: оригинал сохраняется без сжатия */
	const addImageFile = async (file: File, name?: string): Promise<boolean> => {
		const id = `custom-${crypto.randomUUID()}`
		try {
			// Просим браузер не удалять данные при нехватке места
			await navigator.storage?.persist?.()
			await putImage(id, file)
		} catch {
			return false
		}

		const url = URL.createObjectURL(file)
		backgrounds.value.push({
			id,
			name: name || file.name.replace(/\.[^.]+$/, ''),
			type: 'image',
			value: url,
			preview: url,
			custom: true,
			blobId: id
		})

		if (!persistCustom()) {
			backgrounds.value.pop()
			URL.revokeObjectURL(url)
			await deleteImage(id).catch(() => {})
			return false
		}
		setBackground(id)
		return true
	}

	const removeBackground = (backgroundId: string) => {
		const bg = backgrounds.value.find(b => b.id === backgroundId)
		// Встроенные удалять нельзя
		if (!bg?.custom) return

		if (bg.blobId) {
			URL.revokeObjectURL(bg.value)
			deleteImage(bg.blobId).catch(() => {})
		}

		backgrounds.value = backgrounds.value.filter(b => b.id !== backgroundId)
		persistCustom()

		if (currentBackgroundId.value === backgroundId) {
			setBackground('default')
		}
	}

	const resetBackground = () => setBackground('default')

	const loadSavedBackground = () => {
		const savedId = localStorage.getItem(SELECTED_KEY)
		if (savedId && backgrounds.value.some(b => b.id === savedId)) {
			currentBackgroundId.value = savedId
		}
	}

	/** После запуска достаёт оригиналы из IndexedDB и делает из них ссылки */
	const hydrateImages = async () => {
		const withBlob = backgrounds.value.filter(b => b.blobId)
		let changed = false

		for (const bg of withBlob) {
			const blob = await getImage(bg.blobId!).catch(() => undefined)
			if (blob) {
				const url = URL.createObjectURL(blob)
				bg.value = url
				bg.preview = url
			} else {
				// Файл пропал из хранилища: убираем запись
				backgrounds.value = backgrounds.value.filter(b => b.id !== bg.id)
				if (currentBackgroundId.value === bg.id)
					currentBackgroundId.value = 'default'
				changed = true
			}
		}
		if (changed) persistCustom()
	}

	loadSavedBackground()
	hydrateImages()

	return {
		currentBackgroundId,
		backgrounds,
		currentBackground,
		availableBackgrounds,
		customBackgrounds,
		backgroundStyle,
		setBackground,
		addBackground,
		addImageFile,
		removeBackground,
		resetBackground,
		loadSavedBackground
	}
})
