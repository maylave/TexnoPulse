import { WsServerManager } from './wsServer.js'

class AppServer extends WsServerManager {
	// ==========================================
	// 1. УНИВЕРСАЛЬНЫЕ СОСТОЯНИЯ (ОШИБКИ И УСПЕХ)
	// ==========================================

	notifyError(message: string, details?: any) {
		this.notify('app:error', {
			message,
			details,
			timestamp: Date.now()
		})
	}

	notifySuccess(action: string, message: string) {
		this.notify('app:success', {
			action,
			message
		})
	}

	// ==========================================
	// 2. ПРОЦЕССЫ И ЗАГРУЗКИ (АНИМАЦИИ В UI)
	// ==========================================

	// Общие процессы загрузки (например, парсинг больших данных)
	notifyLoading(
		processName: string,
		progress: number,
		status: 'started' | 'in_progress' | 'completed' | 'failed' = 'in_progress'
	) {
		this.notify('app:loading', {
			processName,
			progress,
			status
		})
	}

	// Детализированная передача файлов (для прогресс-баров)
	notifyFileTransfer(
		fileId: string,
		fileName: string,
		progress: number,
		type: 'upload' | 'download',
		status: 'started' | 'transferring' | 'completed' | 'error' = 'transferring'
	) {
		this.notify('file:transfer', {
			fileId,
			fileName,
			progress,
			type,
			status
		})
	}

	// ==========================================
	// 3. P2P И СИНХРОНИЗАЦИЯ УСТРОЙСТВ
	// ==========================================

	notifySync(
		entity: 'device' | 'chat' | 'messages' | 'database',
		status: 'syncing' | 'synced' | 'failed',
		meta?: any
	) {
		this.notify('app:sync', {
			entity,
			status,
			meta
		})
	}

	// ==========================================
	// 4. БИЗНЕС-ЛОГИКА (ЧАТЫ И СООБЩЕНИЯ)
	// ==========================================

	notifyChatCreated(node: any) {
		this.notify('chat:created', { node })
	}

	notifyChatDeleted(nodeId: string) {
		this.notify('chat:deleted', { id: nodeId })
	}

	notifyNewMessage(chatId: string, message: any) {
		this.notify('message:new', { chatId, message })
	}
}

// Экспортируем единственный экземпляр на всё приложение (Singleton)
export const appServer = new AppServer()
