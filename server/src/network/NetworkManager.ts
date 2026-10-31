import { WebSocket, WebSocketServer } from 'ws'
import { Readable } from 'stream'

export const activePeers = new Set<WebSocket>()
export const activeDeviceSockets = new Map<string, WebSocket>()

const incomingStreams = new Map<string, Readable>()

let onTextCallback: ((ws: WebSocket, message: any) => void) | null = null
let onBinaryCallback: ((ws: WebSocket, data: Buffer) => void) | null = null
let onConnectionCallback: ((ws: WebSocket) => void) | null = null

export function onTextMessage(callback: (ws: WebSocket, message: any) => void) {
	onTextCallback = callback
}

export function onBinaryMessage(
	callback: (ws: WebSocket, data: Buffer) => void
) {
	onBinaryCallback = callback
}

export function onConnection(callback: (ws: WebSocket) => void) {
	onConnectionCallback = callback
}

export function startWebSocketServer(port: number) {
	try {
		const wss = new WebSocketServer({ port })
		wss.on('connection', ws => setupPeerEvents(ws))
		wss.on('error', (err: any) => {
			console.warn(`[NetworkManager] P2P сервер (порт ${port}) предупреждение:`, err.message)
		})
		return wss
	} catch (err: any) {
		console.warn(`[NetworkManager] Не удалось запустить P2P сервер на порту ${port}:`, err.message)
		return null
	}
}

export function connectToPeer(ip: string, port: number) {
	const ws = new WebSocket(`ws://${ip}:${port}`)
	ws.on('open', () => setupPeerEvents(ws))
	ws.on('error', err =>
		console.error(`[NetworkManager] Ошибка соединения:`, err)
	)
}

function setupPeerEvents(ws: WebSocket) {
	activePeers.add(ws)
	if (onConnectionCallback) onConnectionCallback(ws)

	ws.on('message', (data, isBinary) => {
		if (isBinary) {
			const buffer = data as Buffer
			if (onBinaryCallback) onBinaryCallback(ws, buffer)
			return
		}

		const message = JSON.parse(data.toString())

		// Привязываем deviceId к сокету при авторизации
		if (message.type === 'AUTH' && message.deviceId) {
			activeDeviceSockets.set(message.deviceId, ws)
			;(ws as any).deviceId = message.deviceId
		}

		if (onTextCallback) onTextCallback(ws, message)
	})

	ws.on('close', () => {
		activePeers.delete(ws)
		for (const [id, socket] of activeDeviceSockets.entries()) {
			if (socket === ws) activeDeviceSockets.delete(id)
		}
	})
}

export function broadcastText(payload: any) {
	const dataString = JSON.stringify(payload)
	activePeers.forEach(peer => {
		if (peer.readyState === 1) peer.send(dataString)
	})
}

export function sendTextToDevice(targetDeviceId: string, payload: any) {
	const ws = activeDeviceSockets.get(targetDeviceId)
	if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload))
}
