// src/composables/useGlobalSearch.ts
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
	Search,
	X,
	MessageSquare,
	Folder,
	Sliders,
	Palette,
	FileText,
	Image as ImageIcon,
	Video as VideoIcon,
	Code,
	Terminal,
	History,
	Sparkles,
	SlidersHorizontal,
	Quote,
	Film,
	BookOpen,
	Layers
} from 'lucide-vue-next'
import { useNodeStore } from '@/stores/node'
import { useMessagesStore } from '@/stores/messages'
import { useModalStore } from '@/stores/appModal'
import { useColorMemoryStore } from '@/stores/colorMemory'
import { useWordFrequencyStore } from '@/stores/wordFrequency'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/appLayout'
import { SETTINGS_DEFINITIONS } from '@/config/settingsDefinitions'
import { SETTINGS_MENU_ITEMS } from '@/config/settingsMenu'
import type { Message, AnyMessageContent } from '@/types/message'
import type { AppNode } from '@/types/chat'
import type { SettingDefinition } from '@/types/settings'

export type SearchScope =
	| 'all'
	| 'chat'
	| 'message'
	| 'photo'
	| 'video'
	| 'file'
	| 'code'
	| 'setting'
	| 'color'
	| 'cmd'
	| 'dict'

export interface SearchResultItem {
	id: string
	type: SearchScope
	title: string
	subtitle?: string
	description?: string
	icon?: any
	badge?: string
	colorClass?: string
	swatchHex?: string
	thumbnailUrl?: string
	chatId?: string
	payload?: any
	action: () => void | Promise<void>
}

export interface SearchCategoryGroup {
	type: SearchScope
	category: string
	items: SearchResultItem[]
}

const RECENT_SEARCHES_STORAGE_KEY = 'snapi_recent_searches_v2'
const DEFAULT_RECENTS = ['Настройки', 'Внешний вид', 'Цвета']

/**
 * Парсер расширенных префиксов поиска:
 * chat:, msg:, photo:, video:, file:, code:, set:, color:, cmd:, dict:
 */
export function parseSearchPrefix(input: string): {
	scope: SearchScope
	cleanQuery: string
	rawPrefix: string | null
} {
	const trimmed = input.trimStart()
	const match = trimmed.match(
		/^(chat|чат|папка|папки|msg|message|сообщение|сообщения|photo|img|image|фото|картинка|изображение|video|видео|file|files|файл|файлы|media|медиа|code|код|setting|settings|настройки|set|color|цвет|цвета|cmd|действие|действия|команда|command|dict|словарь|слово):(.*)$/i
	)

	if (!match) {
		return { scope: 'all', cleanQuery: trimmed, rawPrefix: null }
	}

	const rawPrefix = match[1].toLowerCase()
	const cleanQuery = match[2].trim()

	if (['chat', 'чат', 'папка', 'папки'].includes(rawPrefix)) {
		return { scope: 'chat', cleanQuery, rawPrefix }
	}
	if (['msg', 'message', 'сообщение', 'сообщения'].includes(rawPrefix)) {
		return { scope: 'message', cleanQuery, rawPrefix }
	}
	if (['photo', 'img', 'image', 'фото', 'картинка', 'изображение'].includes(rawPrefix)) {
		return { scope: 'photo', cleanQuery, rawPrefix }
	}
	if (['video', 'видео'].includes(rawPrefix)) {
		return { scope: 'video', cleanQuery, rawPrefix }
	}
	if (['file', 'files', 'файл', 'файлы', 'media', 'медиа'].includes(rawPrefix)) {
		return { scope: 'file', cleanQuery, rawPrefix }
	}
	if (['code', 'код'].includes(rawPrefix)) {
		return { scope: 'code', cleanQuery, rawPrefix }
	}
	if (['setting', 'settings', 'настройки', 'set'].includes(rawPrefix)) {
		return { scope: 'setting', cleanQuery, rawPrefix }
	}
	if (['color', 'цвет', 'цвета'].includes(rawPrefix)) {
		return { scope: 'color', cleanQuery, rawPrefix }
	}
	if (['cmd', 'действие', 'действия', 'команда', 'command'].includes(rawPrefix)) {
		return { scope: 'cmd', cleanQuery, rawPrefix }
	}
	if (['dict', 'словарь', 'слово'].includes(rawPrefix)) {
		return { scope: 'dict', cleanQuery, rawPrefix }
	}

	return { scope: 'all', cleanQuery: trimmed, rawPrefix: null }
}

/**
 * Разбивка текста на части с флагом подсветки для визуального совпадения
 */
export function highlightText(
	text: string,
	query: string
): { text: string; highlight: boolean }[] {
	if (!text) return []
	if (!query || !query.trim()) return [{ text, highlight: false }]

	const cleanQuery = query.trim()
	const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const regex = new RegExp(`(${escaped})`, 'gi')
	const parts = text.split(regex)

	return parts.map(part => ({
		text: part,
		highlight: part.toLowerCase() === cleanQuery.toLowerCase()
	}))
}

export function useGlobalSearch() {
	const nodeStore = useNodeStore()
	const messagesStore = useMessagesStore()
	const modalStore = useModalStore()
	const colorStore = useColorMemoryStore()
	const wordStore = useWordFrequencyStore()
	const settingsStore = useSettingsStore()
	const appStore = useAppStore()

	// Реактивное состояние
	const query = ref('')
	const manualScope = ref<SearchScope>('all')
	const isSearching = ref(false)
	const selectedIndex = ref(0)
	const recentSearches = ref<string[]>([])

	// Фоновая синхронизация: загружаем сообщения из всех чатов для полного глобального поиска
	const ensureAllChatsLoaded = async () => {
		try {
			if (typeof (messagesStore as any).loadAllChatsMessages === 'function') {
				await (messagesStore as any).loadAllChatsMessages()
			}
		} catch (e) {
			console.warn('[GlobalSearch] Ошибка фоновой загрузки всех чатов:', e)
		}
	}

	onMounted(() => {
		ensureAllChatsLoaded()
	})

	// Загрузка недавних запросов
	try {
		const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY)
		if (saved) {
			recentSearches.value = JSON.parse(saved)
		} else {
			recentSearches.value = [...DEFAULT_RECENTS]
		}
	} catch {
		recentSearches.value = [...DEFAULT_RECENTS]
	}

	const saveRecentSearches = () => {
		try {
			localStorage.setItem(
				RECENT_SEARCHES_STORAGE_KEY,
				JSON.stringify(recentSearches.value.slice(0, 10))
			)
		} catch {}
	}

	const addRecent = (text: string) => {
		const clean = text.trim()
		if (!clean) return
		recentSearches.value = [
			clean,
			...recentSearches.value.filter(s => s !== clean)
		].slice(0, 10)
		saveRecentSearches()
	}

	const removeRecent = (text: string) => {
		recentSearches.value = recentSearches.value.filter(s => s !== text)
		saveRecentSearches()
	}

	const clearRecent = () => {
		recentSearches.value = []
		saveRecentSearches()
	}

	// Разобранный запрос
	const parsed = computed(() => parseSearchPrefix(query.value))

	// Эффективный фильтр
	const activeScope = computed<SearchScope>(() => {
		if (parsed.value.scope !== 'all') return parsed.value.scope
		return manualScope.value
	})

	const cleanTerm = computed(() => parsed.value.cleanQuery)
	const lowerTerm = computed(() => cleanTerm.value.toLowerCase())

	// Карта заголовков чатов
	const chatNameMap = computed(() => {
		const map = new Map<string, string>()
		for (const node of nodeStore.nodes) {
			map.set(node.id, node.label)
		}
		return map
	})

	// Плавный скролл и подсветка сообщения
	const scrollToMessage = (msgId: string) => {
		const targetId = `msg-${msgId}`
		const runScroll = () => {
			const el = document.getElementById(targetId)
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' })
				el.classList.add('highlight-target-pulse')
				setTimeout(() => el.classList.remove('highlight-target-pulse'), 2500)
				return true
			}
			return false
		}

		if (!runScroll()) {
			setTimeout(runScroll, 150)
			setTimeout(runScroll, 400)
		}
	}

	// 1. ПОИСК ПО ЧАТАМ И ПАПКАМ
	const chatResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const filtered = nodeStore.nodes.filter(node => {
			if (!term) return true
			const matchLabel = node.label.toLowerCase().includes(term)
			const matchPreview = node.metaDate?.chat?.lastMessagePreview
				?.toLowerCase()
				.includes(term)
			return matchLabel || matchPreview
		})

		return filtered.slice(0, 12).map(node => {
			const isFolder = node.type === 'folder'
			return {
				id: `chat-${node.id}`,
				type: 'chat',
				title: node.label,
				subtitle: isFolder
					? 'Папка диалогов'
					: node.metaDate?.chat?.lastMessagePreview || 'Диалог',
				icon: isFolder ? Folder : MessageSquare,
				badge: isFolder ? 'Папка' : 'Чат',
				colorClass: isFolder ? 'text-amber-400' : 'text-sky-400',
				payload: node,
				action: async () => {
					addRecent(node.label)
					modalStore.close()
					if (isFolder) {
						await nodeStore.toggleFolder(node.id)
					} else {
						await nodeStore.selectChat(node.id)
					}
				}
			}
		})
	})

	// 2. ПОИСК ПО ВСЕМ СООБЩЕНИЯМ ВО ВСЕХ ЧАТАХ
	const messageResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const matches: SearchResultItem[] = []

		for (const msg of messagesStore.messages) {
			if (matches.length >= 25) break

			let matchedSnippet = ''
			let snippetPrefix = ''

			for (const block of msg.content) {
				if (block.type === 'text') {
					if (!term || block.text.toLowerCase().includes(term)) {
						matchedSnippet = block.text
						break
					}
				} else if (block.type === 'code') {
					const codeAll = `${block.fileName || ''} ${block.language || ''} ${block.code || ''}`
					if (!term || codeAll.toLowerCase().includes(term)) {
						matchedSnippet = block.code || block.fileName || 'Блок кода'
						snippetPrefix = `[Код: ${block.language || 'text'}] `
						break
					}
				} else if (block.type === 'checklist') {
					const checkAll = `${block.title || ''} ${block.items?.map(i => i.text).join(' ') || ''}`
					if (!term || checkAll.toLowerCase().includes(term)) {
						matchedSnippet = block.title || block.items?.[0]?.text || 'Чек-лист'
						snippetPrefix = '[Чек-лист] '
						break
					}
				} else if (block.type === 'poll') {
					const pollAll = `${block.question || ''} ${block.options?.map(o => o.text).join(' ') || ''}`
					if (!term || pollAll.toLowerCase().includes(term)) {
						matchedSnippet = block.question
						snippetPrefix = '[Опрос] '
						break
					}
				} else if (block.type === 'table') {
					const tableStr = block.rows?.flat().join(' ') || ''
					if (!term || tableStr.toLowerCase().includes(term)) {
						matchedSnippet = tableStr.slice(0, 100)
						snippetPrefix = '[Таблица] '
						break
					}
				} else if (block.type === 'canvas') {
					const canvasStr = JSON.stringify(block.nodes || '')
					if (!term || canvasStr.toLowerCase().includes(term)) {
						matchedSnippet = 'Холст диаграммы'
						snippetPrefix = '[Холст] '
						break
					}
				}
			}

			if (matchedSnippet || (!term && msg.content.length > 0)) {
				const chatTitle = chatNameMap.value.get(msg.chatId) || 'Диалог'
				let displaySnippet = snippetPrefix + matchedSnippet

				if (term && matchedSnippet) {
					const idx = matchedSnippet.toLowerCase().indexOf(term)
					if (idx !== -1) {
						const start = Math.max(0, idx - 25)
						const end = Math.min(matchedSnippet.length, idx + term.length + 50)
						displaySnippet =
							snippetPrefix +
							(start > 0 ? '...' : '') +
							matchedSnippet.substring(start, end) +
							(end < matchedSnippet.length ? '...' : '')
					}
				}

				const senderName = msg.isOwn ? 'Вы' : msg.sender || 'Собеседник'

				matches.push({
					id: `msg-${msg.id}`,
					type: 'message',
					title: chatTitle,
					subtitle: displaySnippet || 'Текст сообщения',
					icon: Quote,
					badge: senderName,
					colorClass: 'text-rose-400',
					chatId: msg.chatId,
					payload: msg,
					action: async () => {
						addRecent(cleanTerm.value || chatTitle)
						modalStore.close()
						await nodeStore.selectChat(msg.chatId)
						await nextTick()
						scrollToMessage(msg.id)
					}
				})
			}
		}

		return matches
	})

	// 3. ПОИСК ПО ФОТО И ИЗОБРАЖЕНИЯМ (во всех чатах)
	const photoResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const matches: SearchResultItem[] = []

		for (const msg of messagesStore.messages) {
			if (matches.length >= 20) break

			for (const block of msg.content) {
				if (block.type === 'image') {
					const chatTitle = chatNameMap.value.get(msg.chatId) || 'Диалог'
					const alt = block.alt || 'Изображение'
					const isMatch =
						!term ||
						alt.toLowerCase().includes(term) ||
						chatTitle.toLowerCase().includes(term) ||
						block.url.toLowerCase().includes(term)

					if (isMatch) {
						matches.push({
							id: `img-${msg.id}-${block.url}`,
							type: 'photo',
							title: alt,
							subtitle: `${chatTitle} • ${new Date(msg.timestamp).toLocaleDateString()}`,
							icon: ImageIcon,
							thumbnailUrl: block.url,
							badge: 'Фото',
							colorClass: 'text-pink-400',
							chatId: msg.chatId,
							payload: block,
							action: async () => {
								addRecent(alt)
								// Собираем галерею всех картинок этого чата
								const chatImages = messagesStore.messages
									.filter(m => m.chatId === msg.chatId)
									.flatMap(m =>
										m.content
											.filter(b => b.type === 'image')
											.map((b: any) => ({
												type: 'image' as const,
												url: b.url,
												title: b.alt || 'Изображение'
											}))
									)

								const curIdx = chatImages.findIndex(i => i.url === block.url)

								modalStore.open('image-modal', {
									url: block.url,
									type: 'image',
									title: alt,
									items: chatImages.length > 0 ? chatImages : [{ url: block.url, type: 'image', title: alt }],
									currentIndex: curIdx !== -1 ? curIdx : 0
								})
							}
						})
					}
				}
			}
		}

		return matches
	})

	// 4. ПОИСК ПО ВИДЕОЗАПИСЯМ (во всех чатах)
	const videoResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const matches: SearchResultItem[] = []

		for (const msg of messagesStore.messages) {
			if (matches.length >= 15) break

			for (const block of msg.content) {
				if (block.type === 'video') {
					const chatTitle = chatNameMap.value.get(msg.chatId) || 'Диалог'
					const title = 'Видеозапись'
					const isMatch =
						!term ||
						title.toLowerCase().includes(term) ||
						chatTitle.toLowerCase().includes(term) ||
						block.url.toLowerCase().includes(term)

					if (isMatch) {
						matches.push({
							id: `vid-${msg.id}-${block.url}`,
							type: 'video',
							title,
							subtitle: `${chatTitle} • ${new Date(msg.timestamp).toLocaleDateString()}`,
							icon: Film,
							thumbnailUrl: block.thumbnail,
							badge: 'Видео',
							colorClass: 'text-red-400',
							chatId: msg.chatId,
							payload: block,
							action: async () => {
								addRecent(title)
								modalStore.open('image-modal', {
									url: block.url,
									type: 'video',
									title,
									items: [{ url: block.url, type: 'video', title }],
									currentIndex: 0
								})
							}
						})
					}
				}
			}
		}

		return matches
	})

	// 5. ПОИСК ПО ДОКУМЕНТАМ И ФАЙЛАМ (во всех чатах)
	const fileResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const matches: SearchResultItem[] = []

		for (const msg of messagesStore.messages) {
			if (matches.length >= 20) break

			for (const block of msg.content) {
				if (block.type === 'file' || block.type === 'audio') {
					const chatTitle = chatNameMap.value.get(msg.chatId) || 'Диалог'
					const name =
						block.type === 'file'
							? block.name
							: `Аудиозапись (${block.duration || 0} сек)`

					const isMatch =
						!term ||
						name.toLowerCase().includes(term) ||
						chatTitle.toLowerCase().includes(term)

					if (isMatch) {
						matches.push({
							id: `file-${msg.id}-${name}`,
							type: 'file',
							title: name,
							subtitle: `${chatTitle} • ${block.type === 'file' ? block.size || 'Файл' : 'Аудио'} • ${new Date(msg.timestamp).toLocaleDateString()}`,
							icon: FileText,
							badge: block.type === 'file' ? 'Файл' : 'Аудио',
							colorClass: 'text-cyan-400',
							chatId: msg.chatId,
							action: async () => {
								addRecent(name)
								modalStore.close()
								await nodeStore.selectChat(msg.chatId)
								await nextTick()
								scrollToMessage(msg.id)
							}
						})
					}
				}
			}
		}

		return matches
	})

	// 6. ПОИСК ПО ИСХОДНОМУ КОДУ (во всех чатах)
	const codeResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const matches: SearchResultItem[] = []

		for (const msg of messagesStore.messages) {
			if (matches.length >= 15) break

			for (const block of msg.content) {
				if (block.type === 'code') {
					const chatTitle = chatNameMap.value.get(msg.chatId) || 'Диалог'
					const codeTitle = block.fileName || `Фрагмент (${block.language || 'code'})`
					const codeContent = block.code || ''

					const isMatch =
						!term ||
						codeTitle.toLowerCase().includes(term) ||
						block.language.toLowerCase().includes(term) ||
						codeContent.toLowerCase().includes(term) ||
						chatTitle.toLowerCase().includes(term)

					if (isMatch) {
						matches.push({
							id: `code-${msg.id}-${codeTitle}`,
							type: 'code',
							title: codeTitle,
							subtitle: `${chatTitle} • Язык: ${block.language || 'text'} • ${new Date(msg.timestamp).toLocaleDateString()}`,
							icon: Code,
							badge: block.language || 'Код',
							colorClass: 'text-amber-400',
							chatId: msg.chatId,
							action: async () => {
								addRecent(codeTitle)
								modalStore.close()
								await nodeStore.selectChat(msg.chatId)
								await nextTick()
								scrollToMessage(msg.id)
							}
						})
					}
				}
			}
		}

		return matches
	})

	// 7. ПОИСК ПО НАСТРОЙКАМ
	const settingResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const results: SearchResultItem[] = []

		// 7.1. Поиск по разделам настроек
		for (const tab of SETTINGS_MENU_ITEMS) {
			if (!term || tab.label.toLowerCase().includes(term) || tab.id.toLowerCase().includes(term)) {
				results.push({
					id: `tab-${tab.id}`,
					type: 'setting',
					title: `Раздел: ${tab.label}`,
					subtitle: `Вкладка параметров приложения`,
					icon: Sliders,
					badge: 'Раздел',
					colorClass: 'text-violet-400',
					action: () => {
						addRecent(tab.label)
						modalStore.open('settings', { tab: tab.id })
					}
				})
			}
		}

		// 7.2. Поиск по отдельным параметрам настроек
		const filteredDef = SETTINGS_DEFINITIONS.filter(s => {
			if (!term) return true
			return (
				s.label.toLowerCase().includes(term) ||
				s.description?.toLowerCase().includes(term) ||
				s.group.toLowerCase().includes(term) ||
				s.id.toLowerCase().includes(term)
			)
		})

		for (const setting of filteredDef.slice(0, 12)) {
			results.push({
				id: `setting-${setting.id}`,
				type: 'setting',
				title: setting.label,
				subtitle: `${setting.group}${setting.description ? ' • ' + setting.description : ''}`,
				icon: SlidersHorizontal,
				badge: setting.group,
				colorClass: 'text-violet-300',
				payload: setting,
				action: () => {
					addRecent(setting.label)
					modalStore.open('settings', {
						tab: setting.category,
						settingId: setting.id,
						group: setting.group
					})
				}
			})
		}

		return results
	})

	// 8. ПОИСК ПО ЦВЕТАМ И ПАЛИТРЕ
	const colorResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const results: SearchResultItem[] = []
		const seenHexes = new Set<string>()

		// 8.1. Цвета из истории colorMemoryStore
		for (const c of colorStore.colors) {
			const isMatch =
				!term ||
				c.hex.toLowerCase().includes(term) ||
				c.hex.replace('#', '').toLowerCase().includes(term) ||
				c.name?.toLowerCase().includes(term)

			if (isMatch && !seenHexes.has(c.hex.toUpperCase())) {
				seenHexes.add(c.hex.toUpperCase())
				results.push({
					id: `color-${c.hex}-${c.chatId || 'global'}`,
					type: 'color',
					title: c.name ? `${c.name} (${c.hex})` : c.hex,
					subtitle: `Использован ${c.count} раз${c.chatId ? ' • В чате' : ''}`,
					icon: Palette,
					swatchHex: c.hex,
					badge: c.hex,
					colorClass: 'text-emerald-400',
					action: async () => {
						addRecent(c.name ? `${c.name} ${c.hex}` : c.hex)
						try {
							await navigator.clipboard.writeText(c.hex)
						} catch {}
						modalStore.close()
					}
				})
			}
		}

		// 8.2. Цветовые настройки интерфейса
		for (const s of SETTINGS_DEFINITIONS) {
			if (s.type === 'color-picker') {
				const isMatch =
					!term ||
					s.label.toLowerCase().includes(term) ||
					s.group.toLowerCase().includes(term) ||
					String(s.defaultValue).toLowerCase().includes(term)

				if (isMatch) {
					const curVal = settingsStore.get(s) || s.defaultValue
					results.push({
						id: `setting-color-${s.id}`,
						type: 'color',
						title: s.label,
						subtitle: `${s.group} • Текущий: ${curVal}`,
						icon: Palette,
						swatchHex: typeof curVal === 'string' ? curVal : undefined,
						badge: 'Цвет интерфейса',
						colorClass: 'text-teal-400',
						action: () => {
							addRecent(s.label)
							modalStore.open('settings', {
								tab: s.category,
								settingId: s.id,
								group: s.group
							})
						}
					})
				}
			}
		}

		return results.slice(0, 15)
	})

	// 9. ПОИСК ПО СЛОВАРЮ И ПОДСКАЗКАМ
	const dictResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const words = wordStore.words || []
		const filtered = words.filter(w => {
			if (!term) return true
			return (
				w.word.toLowerCase().includes(term) ||
				w.hint?.toLowerCase().includes(term) ||
				w.detail?.toLowerCase().includes(term)
			)
		})

		return filtered.slice(0, 10).map(w => ({
			id: `word-${w.word}`,
			type: 'dict',
			title: w.word,
			subtitle: `Частота: ${w.count}${w.hint ? ' • ' + w.hint : ''}${w.detail ? ' • ' + w.detail : ''}`,
			icon: BookOpen,
			badge: w.category === 'code' ? 'Код' : 'Слово',
			colorClass: 'text-amber-300',
			action: () => {
				addRecent(w.word)
				modalStore.open('settings', { tab: 'dictionary' })
			}
		}))
	})

	// 10. БЫСТРЫЕ КОМАНДЫ
	const commandResults = computed<SearchResultItem[]>(() => {
		if (!lowerTerm.value && activeScope.value === 'all') return []
		const term = lowerTerm.value

		const commands = [
			{
				title: 'Открыть настройки',
				subtitle: 'Все параметры оформления, горячие клавиши и безопасность',
				keywords: ['настройки', 'параметры', 'settings', 'config'],
				icon: Sliders,
				action: () => modalStore.open('settings')
			},
			{
				title: 'Словарь подсказок',
				subtitle: 'Настройка умного автодополнения и частотных слов',
				keywords: ['словарь', 'подсказки', 'слова', 'dictionary', 'words'],
				icon: Sparkles,
				action: () => modalStore.open('settings', { tab: 'dictionary' })
			},
			{
				title: 'Горячие клавиши',
				subtitle: 'Просмотр и изменение клавиатурных сочетаний',
				keywords: ['клавиши', 'хоткеи', 'hotkeys', 'shortcuts'],
				icon: Terminal,
				action: () => modalStore.open('settings', { tab: 'hotkeys' })
			},
			{
				title: 'Открыть редактор текста',
				subtitle: 'Черновик и форматирование больших сообщений',
				keywords: ['редактор', 'черновик', 'editor', 'draft'],
				icon: FileText,
				action: () => messagesStore.openEditor()
			},
			{
				title: 'Скрыть/Показать сайдбар',
				subtitle: 'Переключить видимость левой панели',
				keywords: ['сайдбар', 'боковая панель', 'sidebar'],
				icon: SlidersHorizontal,
				action: () => appStore.toggleLeftSidebar()
			},
			{
				title: 'Очистить историю поиска',
				subtitle: 'Удалить сохраненные недавние запросы',
				keywords: ['очистить', 'история', 'clear', 'history'],
				icon: History,
				action: () => clearRecent()
			}
		]

		const filtered = commands.filter(c => {
			if (!term) return true
			return (
				c.title.toLowerCase().includes(term) ||
				c.subtitle.toLowerCase().includes(term) ||
				c.keywords.some(k => k.includes(term))
			)
		})

		return filtered.map(c => ({
			id: `cmd-${c.title}`,
			type: 'cmd',
			title: c.title,
			subtitle: c.subtitle,
			icon: c.icon,
			badge: 'Команда',
			colorClass: 'text-indigo-400',
			action: () => {
				addRecent(c.title)
				c.action()
			}
		}))
	})

	// Сгруппированные результаты по категориям
	const groupedResults = computed<SearchCategoryGroup[]>(() => {
		const groups: SearchCategoryGroup[] = []
		const scope = activeScope.value

		if (scope === 'all' || scope === 'chat') {
			if (chatResults.value.length > 0) {
				groups.push({
					type: 'chat',
					category: 'Чаты и папки',
					items: chatResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'message') {
			if (messageResults.value.length > 0) {
				groups.push({
					type: 'message',
					category: 'Сообщения во всех чатах',
					items: messageResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'photo') {
			if (photoResults.value.length > 0) {
				groups.push({
					type: 'photo',
					category: 'Фото и изображения',
					items: photoResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'video') {
			if (videoResults.value.length > 0) {
				groups.push({
					type: 'video',
					category: 'Видеозаписи',
					items: videoResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'file') {
			if (fileResults.value.length > 0) {
				groups.push({
					type: 'file',
					category: 'Документы и файлы',
					items: fileResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'code') {
			if (codeResults.value.length > 0) {
				groups.push({
					type: 'code',
					category: 'Исходный код',
					items: codeResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'setting') {
			if (settingResults.value.length > 0) {
				groups.push({
					type: 'setting',
					category: 'Настройки приложения',
					items: settingResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'color') {
			if (colorResults.value.length > 0) {
				groups.push({
					type: 'color',
					category: 'Цвета и палитра',
					items: colorResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'dict') {
			if (dictResults.value.length > 0) {
				groups.push({
					type: 'dict',
					category: 'Словарь и подсказки',
					items: dictResults.value
				})
			}
		}

		if (scope === 'all' || scope === 'cmd') {
			if (commandResults.value.length > 0) {
				groups.push({
					type: 'cmd',
					category: 'Быстрые команды',
					items: commandResults.value
				})
			}
		}

		return groups
	})

	// Плоский список для стрелочной навигации
	const flatResults = computed<SearchResultItem[]>(() => {
		return groupedResults.value.flatMap(g => g.items)
	})

	// Сброс индекса при изменении запроса
	watch([query, manualScope], () => {
		selectedIndex.value = 0
	})

	const setScope = (scope: SearchScope) => {
		manualScope.value = scope
		if (parsed.value.rawPrefix) {
			if (scope === 'all') {
				query.value = cleanTerm.value
			} else {
				query.value = `${scope}:${cleanTerm.value}`
			}
		} else if (scope !== 'all') {
			query.value = `${scope}:${query.value.trim()}`
		}
	}

	const applyRecent = (term: string) => {
		query.value = term
	}

	const navigateNext = () => {
		if (flatResults.value.length === 0) return
		selectedIndex.value = (selectedIndex.value + 1) % flatResults.value.length
	}

	const navigatePrev = () => {
		if (flatResults.value.length === 0) return
		selectedIndex.value =
			(selectedIndex.value - 1 + flatResults.value.length) %
			flatResults.value.length
	}

	const executeSelected = () => {
		const current = flatResults.value[selectedIndex.value]
		if (current) {
			current.action()
		}
	}

	return {
		query,
		manualScope,
		activeScope,
		cleanTerm,
		isSearching,
		selectedIndex,
		recentSearches,
		groupedResults,
		flatResults,
		ensureAllChatsLoaded,
		setScope,
		applyRecent,
		removeRecent,
		clearRecent,
		navigateNext,
		navigatePrev,
		executeSelected,
		highlightText
	}
}
