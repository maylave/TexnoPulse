import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	startWebSocketServer,
	connectToPeer,
	broadcastToPeers
} from '../NetworkManager.js'

const { mockWsServerOn, mockWsOn, mockWsSend } = vi.hoisted(() => ({
	mockWsServerOn: vi.fn(),
	mockWsOn: vi.fn(),
	mockWsSend: vi.fn()
}))

vi.mock('ws', () => {
	return {
		WebSocketServer: class {
			on = mockWsServerOn
		},
		WebSocket: class {
			static OPEN = 1
			on = mockWsOn
			send = mockWsSend
			readyState = 1
		}
	}
})

describe('Сетевой менеджер (NetworkManager)', () => {
	let consoleSpy: any

	beforeEach(() => {
		vi.clearAllMocks()
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		consoleSpy.mockRestore()
	})

	it('запускает сервер и подписывается на входящие подключения', () => {
		startWebSocketServer(3005, 'server-pc')

		expect(mockWsServerOn).toHaveBeenCalledWith(
			'connection',
			expect.any(Function)
		)
		expect(consoleSpy).toHaveBeenCalledWith(
			'The WebSocket server is running on port 3005'
		)
	})

	it('создает сокет при подключении к узлу', () => {
		connectToPeer('192.168.1.15', 3005, 'client-pc')

		expect(mockWsOn).toHaveBeenCalledWith('open', expect.any(Function))
		expect(mockWsOn).toHaveBeenCalledWith('error', expect.any(Function))
	})

	it('отправляет HANDSHAKE сразу после успешного открытия соединения', () => {
		connectToPeer('192.168.1.15', 3005, 'client-pc')

		const openCall = mockWsOn.mock.calls.find(call => call[0] === 'open')
		const openCallback = openCall![1]

		openCallback()

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('Successfully connected')
		)
		expect(mockWsSend).toHaveBeenCalledWith(
			JSON.stringify({
				type: 'HANDSHAKE',
				deviceId: 'client-pc'
			})
		)
	})

	it('обрабатывает входящий HANDSHAKE от другого узла', () => {
		connectToPeer('192.168.1.15', 3005, 'client-pc')

		const openCall = mockWsOn.mock.calls.find(call => call[0] === 'open')
		openCall![1]()

		const messageCall = mockWsOn.mock.calls.find(call => call[0] === 'message')
		const messageCallback = messageCall![1]

		const fakeIncomingData = JSON.stringify({
			type: 'HANDSHAKE',
			deviceId: 'remote-pc'
		})
		messageCallback(fakeIncomingData)

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('remote-pc')
		)
	})

	it('рассылает данные всем активным узлам', () => {
		const payload = { type: 'NEW_MESSAGE', text: 'Привет!' }

		connectToPeer('192.168.1.15', 3005, 'client-pc')

		const openCall = mockWsOn.mock.calls.find(call => call[0] === 'open')
		openCall![1]()

		mockWsSend.mockClear()

		broadcastToPeers(payload)

		expect(mockWsSend).toHaveBeenCalledWith(JSON.stringify(payload))
	})
})
