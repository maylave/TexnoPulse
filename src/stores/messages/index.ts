import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { ServerMessage } from '@/api/protocol'
import type { Message, AnyMessageContent } from '@/types/message'
import type { EditorBlock } from '@/types/editor.types'
import type { ChatAttachment } from '@/config/chatInput'
import { useNodeStore } from '@/stores/node'

// Импортируем наши вынесенные утилиты
import { parseContent, withUrls } from './parsers'
import {
	fileToContent,
	editorBlockToContent,
	buildContentFromPayload,
	messageToChatInputPayload
} from './converters'
import { parseMessageContentWithCode } from '@/utils/codeDetection'
import { useWordFrequencyStore } from '@/stores/wordFrequency'
import { useColorMemoryStore } from '@/stores/colorMemory'

const PAGE_SIZE = 30

export const useMessagesStore = defineStore('messages', () => {
	const messages = ref<Message[]>([])
	const myDeviceId = ref<string | null>(null)
	const hasMore = ref<Record<string, boolean>>({})

	const sending = ref(0)
	const isSending = computed(() => sending.value > 0)

	// Продвинутый редактор
	const isEditorOpen = ref(false)
	const draftText = ref('')

	const openEditor = (initialText = '') => {
		draftText.value = initialText
		isEditorOpen.value = true
	}

	const closeEditor = () => {
		isEditorOpen.value = false
	}

	// Редактирование и ответы на сообщения в основном инпуте
	const editingMessage = ref<Message | null>(null)
	const replyingMessage = ref<Message | null>(null)

	const startEditMessage = (msg: Message) => {
		editingMessage.value = msg
		replyingMessage.value = null
	}

	const cancelEditMessage = () => {
		editingMessage.value = null
	}

	const startReplyMessage = (msg: Message) => {
		replyingMessage.value = msg
		editingMessage.value = null
	}

	const cancelReplyMessage = () => {
		replyingMessage.value = null
	}

	/* ---------- Кто я ---------- */
	let mePromise: Promise<void> | null = null
	const ensureMe = () =>
		(mePromise ??= api
			.request('app:me')
			.then(me => {
				myDeviceId.value = me.deviceId
			})
			.catch(e => {
				mePromise = null
				throw e
			}))

	/* ---------- Преобразование данных сервера в сообщение UI ---------- */
	const toMessage = (raw: ServerMessage): Message => {
		const content = parseContent(raw.content)
		const isOwn = raw.senderId === myDeviceId.value

		return {
			id: String(raw.id),
			chatId: raw.chatId,
			content: withUrls(content.blocks),
			timestamp: new Date(raw.createdAt ?? content.createdAt ?? Date.now()),
			isOwn,
			sender: isOwn ? undefined : raw.senderId
		}
	}

	/** Добавляет/обновляет сообщения без дубликатов и сортирует по дате */
	const upsert = (list: Message[]) => {
		const byId = new Map(messages.value.map(m => [m.id, m]))
		for (const m of list) byId.set(m.id, m)
		messages.value = [...byId.values()].sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime()
		)

		// Автоматически индексируем цвета из сообщений в память чата
		try {
			const colorStore = useColorMemoryStore()
			for (const m of list) {
				if (!Array.isArray(m.content)) continue
				for (const blk of m.content) {
					if ((blk as any).type === 'color' && (blk as any).value) {
						colorStore.rememberColor(
							(blk as any).value,
							(blk as any).label,
							(m as any).chatId,
							'chat'
						)
					}
				}
			}
		} catch {}
	}

	/* ---------- Загрузка истории ---------- */
	const loadedChats = new Set<string>()

	const fetchPage = async (chatId: string, offset: number) => {
		await ensureMe()
		const rows = await api.request('message:load', {
			chatId,
			limit: PAGE_SIZE,
			offset
		})
		upsert(rows.map(toMessage))
		return rows.length
	}

	const loadMessages = async (chatId?: string) => {
		const nodeStore = useNodeStore()
		const targetChatId = chatId || nodeStore.activeChatId || 'hello'

		loadedChats.add(targetChatId)

		if (api.status.value !== 'open') {
			await new Promise<void>(resolve => {
				const timer = setTimeout(resolve, 1500)
				const unbind = api.onOpen(() => {
					clearTimeout(timer)
					unbind()
					resolve()
				})
			})
		}

		const count = await fetchPage(targetChatId, 0)
		hasMore.value[targetChatId] = count === PAGE_SIZE
	}

	const loadAllChatsMessages = async () => {
		const nodeStore = useNodeStore()
		const chatNodes = nodeStore.nodes.filter(n => n.type === 'chat')
		const unLoaded = chatNodes.filter(n => !loadedChats.has(n.id))
		if (unLoaded.length === 0) return
		await Promise.allSettled(unLoaded.map(n => loadMessages(n.id)))
	}

	const loadOlder = async (chatId?: string) => {
		const nodeStore = useNodeStore()
		const targetChatId = chatId || nodeStore.activeChatId || 'hello'

		if (hasMore.value[targetChatId] === false) return
		const offset = messages.value.filter(m => m.chatId === targetChatId).length
		const count = await fetchPage(targetChatId, offset)
		hasMore.value[targetChatId] = count === PAGE_SIZE
	}

	/* ---------- Отправка ---------- */
	const withSending = async <T>(fn: () => Promise<T>): Promise<T> => {
		sending.value++
		try {
			return await fn()
		} finally {
			sending.value--
		}
	}

	const send = (blocks: AnyMessageContent[], chatId: string) =>
		api.request('message:send', { chatId, content: { blocks } })

	const sendFromEditor = (blocks: EditorBlock[], chatId?: string) =>
		withSending(async () => {
			const nodeStore = useNodeStore()
			const targetChatId = chatId || nodeStore.activeChatId || 'hello'

			const parts = await Promise.all(blocks.map(editorBlockToContent))
			const content = parts.filter((p): p is AnyMessageContent => p !== null)
			const text = draftText.value
			if (!content.length) return

			if (text) {
				try {
					const wordStore = useWordFrequencyStore()
					wordStore.learnFromText(text)
				} catch {}
			}

			await send(content, targetChatId)
			draftText.value = ''
		})

	const sendFromChatInput = (
		payload: { text: string; attachments: ChatAttachment[] },
		chatId?: string
	) =>
		withSending(async () => {
			const nodeStore = useNodeStore()
			const targetChatId = chatId || nodeStore.activeChatId || 'hello'

			const content = await buildContentFromPayload(payload)
			if (!content.length) return

			if (payload.text.trim()) {
				try {
					const wordStore = useWordFrequencyStore()
					wordStore.learnFromText(payload.text.trim())
				} catch {}
			}

			// Запоминание цветов из отправленных вложений и текста
			try {
				const colorStore = useColorMemoryStore()
				for (const att of payload.attachments) {
					if (att.kind === 'color' && att.color) {
						colorStore.rememberColor(att.color, att.title, targetChatId, 'chat')
					}
				}
				if (payload.text.trim()) {
					colorStore.scanTextForColors(payload.text.trim(), targetChatId)
				}
			} catch {}

			await send(content, targetChatId)
		})

	/* ---------- Правка и удаление ---------- */
	const editMessage = async (
		messageId: string,
		blocks: AnyMessageContent[]
	) => {
		const old = messages.value.find(m => m.id === messageId)
		if (old) {
			old.content = withUrls(blocks as any)
			;(old as any).isEdited = true
		}
		await api.request('message:edit', {
			messageId,
			newContent: {
				blocks,
				createdAt: old?.timestamp ? old.timestamp.getTime() : Date.now()
			}
		})
	}

	const saveEditedMessage = async (
		messageId: string,
		payload: { text: string; attachments: ChatAttachment[] },
		chatId?: string
	) => {
		const nodeStore = useNodeStore()
		const targetChatId = chatId || nodeStore.activeChatId || 'hello'

		const blocks = await buildContentFromPayload(payload)
		if (!blocks.length) return

		// Оптимистичное обновление в UI
		const old = messages.value.find(m => m.id === messageId)
		if (old) {
			old.content = withUrls(blocks as any)
			;(old as any).isEdited = true
		}
		editingMessage.value = null

		if (payload.text.trim()) {
			try {
				const wordStore = useWordFrequencyStore()
				wordStore.learnFromText(payload.text.trim())
			} catch {}
		}

		try {
			const colorStore = useColorMemoryStore()
			for (const att of payload.attachments) {
				if (att.kind === 'color' && att.color) {
					colorStore.rememberColor(att.color, att.title, targetChatId, 'chat')
				}
			}
			if (payload.text.trim()) {
				colorStore.scanTextForColors(payload.text.trim(), targetChatId)
			}
		} catch {}

		try {
			await api.request('message:edit', {
				messageId,
				newContent: {
					blocks,
					createdAt: old?.timestamp ? old.timestamp.getTime() : Date.now()
				}
			})
		} catch (e) {
			console.error('[messages] Ошибка при сохранении сообщения:', e)
		}
	}

	const deleteMessage = async (messageId: string, chatId?: string) => {
		const nodeStore = useNodeStore()
		const targetChatId = chatId || nodeStore.activeChatId || 'hello'

		// Оптимистичное удаление сразу
		messages.value = messages.value.filter(m => m.id !== String(messageId))
		if (editingMessage.value?.id === String(messageId)) {
			editingMessage.value = null
		}
		if (replyingMessage.value?.id === String(messageId)) {
			replyingMessage.value = null
		}

		try {
			await api.request('message:delete', { messageId, chatId: targetChatId })
		} catch (e) {
			console.error('[messages] Ошибка при удалении сообщения:', e)
		}
	}

	/* ---------- Подписка на сокет ---------- */
	let initialized = false

	const init = () => {
		if (initialized) return
		initialized = true

		loadedChats.add('hello')

		api.on('message:new', async ({ message }) => {
			await ensureMe().catch(() => {})
			upsert([toMessage(message)])
		})

		api.on('message:edited', ({ messageId, newContent }) => {
			const msg = messages.value.find(m => m.id === String(messageId))
			if (msg) msg.content = withUrls(parseContent(newContent).blocks)
		})

		api.on('message:deleted', ({ messageId }) => {
			messages.value = messages.value.filter(m => m.id !== String(messageId))
		})

		const resync = () =>
			Promise.all([...loadedChats].map(id => fetchPage(id, 0))).catch(e =>
				console.error('[messages] Не удалось синхронизировать историю:', e)
			)

		api.onOpen(resync)
		if (api.status.value === 'open') void resync()
	}

	return {
		messages,
		myDeviceId,
		hasMore,
		isSending,
		isEditorOpen,
		draftText,
		openEditor,
		closeEditor,
		// Редактирование и ответы
		editingMessage,
		replyingMessage,
		startEditMessage,
		cancelEditMessage,
		startReplyMessage,
		cancelReplyMessage,
		saveEditedMessage,
		init,
		loadMessages,
		loadOlder,
		loadAllChatsMessages,
		sendFromEditor,
		sendFromChatInput,
		editMessage,
		deleteMessage
	}
})
