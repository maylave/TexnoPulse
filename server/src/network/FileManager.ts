import * as fs from 'fs'
import * as path from 'path'
import { WebSocket } from 'ws'

export interface FileMeta {
	filePath: string
	fileName: string
}

const incomingFiles = new Map<WebSocket, FileMeta>()

export class FileManager {
	static expectFile(ws: WebSocket, meta: FileMeta) {
		incomingFiles.set(ws, meta)
		console.log(`[FileManager] Ожидаем прием файла: ${meta.fileName}`)
	}

	// Изменение: теперь метод возвращает метаданные сохраненного файла
	static receiveBinary(ws: WebSocket, data: Buffer): FileMeta | null {
		const meta = incomingFiles.get(ws)
		if (!meta) {
			console.warn('[FileManager] Получен бинарник, но метаданные не ожидались')
			return null
		}

		// Сохраняем в папку uploads
		const fullPath = path.resolve(process.cwd(), 'uploads', meta.filePath)
		fs.mkdirSync(path.dirname(fullPath), { recursive: true })

		// ВАЖНО: fs.writeFileSync читает файл целиком в оперативную память.
		// Для картинок и документов это супер, но фильмы на 2 ГБ так передавать не стоит.
		fs.writeFileSync(fullPath, data)

		incomingFiles.delete(ws)
		console.log(`[FileManager] Файл ${meta.fileName} успешно сохранен!`)

		return meta // Возвращаем инфу, чтобы записать в БД
	}

	static broadcastFile(
		localPath: string,
		targetRelativePath: string,
		fileName: string,
		activePeers: Set<WebSocket>
	) {
		const fileBuffer = fs.readFileSync(localPath)

		// Изменил action на type для совместимости с нашим NetworkManager
		const metaPacket = JSON.stringify({
			type: 'FILE_INCOMING',
			meta: { filePath: targetRelativePath, fileName }
		})

		activePeers.forEach(peer => {
			if (peer.readyState === 1) {
				peer.send(metaPacket) // Сначала предупреждаем
				peer.send(fileBuffer) // Затем шлем байты
			}
		})
	}
}
