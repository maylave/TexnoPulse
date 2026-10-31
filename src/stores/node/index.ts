// src/stores/node.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import type { AppNode } from '@/types/chat'

// Подключаем наши вынесенные утилиты
import { mapChatNodeToAppNode } from './mappers'
import { collectNodeIds, isDescendantNode } from './treeUtils'

export const useNodeStore = defineStore('node', () => {
	// --- STATE ---
	const nodes = ref<AppNode[]>([])
	const activeChatId = ref<string>('hello')
	const draggedNodeId = ref<string | null>(null)

	// --- GETTERS ---
	const rootNodes = computed(() => nodes.value.filter(n => !n.parentId))

	const getChildren = (parentId: string) =>
		nodes.value
			.filter(n => n.parentId === parentId)
			.sort((a, b) => (a.type === b.type ? 0 : a.type === 'folder' ? -1 : 1))

	// Автоматическая загрузка данных при подключении/восстановлении связи
	api.onOpen(async () => {
		console.log("[NodeStore] WebSocket подключен, обновляем список узлов...");
		await fetchNodes();
	});

	// --- ACTIONS ---
	const fetchNodes = async () => {
		try {
			const serverNodes = await api.request('chat:load')
			if (Array.isArray(serverNodes) && serverNodes.length > 0) {
				nodes.value = serverNodes.map(mapChatNodeToAppNode)
			}
		} catch {
			// Offline fallback
		}
	}

	const toggleFolder = async (folderId: string) => {
		const folder = nodes.value.find(
			n => n.id === folderId && n.type === 'folder'
		)
		if (!folder) return

		folder.metaDate.folder ??= { collapsed: false }
		folder.metaDate.folder.collapsed = !folder.metaDate.folder.collapsed

		try {
			await api.request('chat:update', {
				id: folder.id,
				updates: { metadata: folder.metaDate as any }
			})
		} catch {
			// Offline fallback
		}
	}

	const selectChat = async (chatId: string) => {
		activeChatId.value = chatId
		const node = nodes.value.find(n => n.id === chatId)
		if (node?.metaDate.chat) {
			node.metaDate.chat.unreadCount = 0
		}

		const { useMessagesStore } = await import('@/stores/messages')
		const messagesStore = useMessagesStore()
		await messagesStore.loadMessages(chatId)
	}

	const createNode = async (params: {
		label: string
		type: 'folder' | 'chat'
		parentId?: string | null
	}) => {
		const cleanLabel = params.label.trim()
		if (!cleanLabel) return null

		const tempId = `${params.type}-${Date.now()}`
		const localNode: AppNode = {
			id: tempId,
			label: cleanLabel,
			type: params.type,
			parentId: params.parentId || undefined,
			metaDate:
				params.type === 'folder'
					? { folder: { collapsed: false } }
					: {
							chat: {
								avatarUrl: '',
								unreadCount: 0,
								lastMessagePreview: 'Нет сообщений'
							}
						}
		}

		nodes.value.push(localNode)

		if (params.parentId) {
			const parent = nodes.value.find(n => n.id === params.parentId)
			if (parent?.metaDate.folder) {
				parent.metaDate.folder.collapsed = false
			}
		}

		try {
			const created = await api.request('chat:create', {
				parentId: params.parentId ? params.parentId : (null as any),
				type: params.type,
				name: cleanLabel,
				metadata: localNode.metaDate as any
			})

			if (created?.id) {
				localNode.id = String(created.id)
			}
		} catch {
			// Local-first сохранение
		}

		if (localNode.type === 'chat') {
			await selectChat(localNode.id)
		}

		return localNode
	}

	/** Изменение названия и/или метаданных (цвет папки, аватарка чата) */
	const updateNode = async (
		id: string,
		patch: { label?: string; metaDate?: AppNode['metaDate'] }
	) => {
		const node = nodes.value.find(n => n.id === id)
		if (!node) return

		// Снимок для отката, если сохранение в базу не удастся
		const backup = JSON.parse(
			JSON.stringify({ label: node.label, metaDate: node.metaDate })
		)

		// Обычные объекты без Proxy: иначе IPC выдаст "could not be cloned"
		const clean = JSON.parse(JSON.stringify(patch))

		// Сразу обновляем интерфейс
		if (clean.label !== undefined) node.label = clean.label
		if (clean.metaDate !== undefined) node.metaDate = clean.metaDate

		try {
			await api.request('chat:update', {
				id,
				updates: {
					...(clean.label !== undefined && { name: clean.label }),
					...(clean.metaDate !== undefined && { metadata: clean.metaDate })
				} as any
			})
		} catch (e) {
			// Откат и повторный выброс, чтобы модалка показала ошибку
			node.label = backup.label
			node.metaDate = backup.metaDate
			throw e
		}
	}

	const deleteNode = async (nodeId: string) => {
		// Используем вынесенную функцию сбора ID
		const toRemove = new Set(collectNodeIds(nodes.value, nodeId))
		nodes.value = nodes.value.filter(n => !toRemove.has(n.id))

		try {
			await api.request('chat:delete', { id: nodeId })
		} catch {
			// ignore
		}
	}

	const moveNode = async (nodeId: string, newParentId?: string | null) => {
		const finalParentId = newParentId || undefined
		if (nodeId === finalParentId) return

		const node = nodes.value.find(n => n.id === nodeId)
		if (!node) return

		// Используем вынесенную функцию проверки
		if (finalParentId && isDescendantNode(nodes.value, nodeId, finalParentId))
			return

		node.parentId = finalParentId

		if (finalParentId) {
			const target = nodes.value.find(n => n.id === finalParentId)
			if (target?.metaDate.folder) {
				target.metaDate.folder.collapsed = false
			}
		}

		try {
			await api.request('chat:move', {
				id: nodeId,
				newParentId: finalParentId ?? null
			})
		} catch {
			// ignore
		}
	}

	return {
		nodes,
		rootNodes,
		activeChatId,
		draggedNodeId,
		getChildren,
		fetchNodes,
		toggleFolder,
		selectChat,
		createNode,
		updateNode,
		deleteNode,
		moveNode
	}
})
