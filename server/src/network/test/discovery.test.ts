import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'
import { Discovery } from '../DeviceDiscoverer.js'

vi.mock('os', () => ({
	hostname: vi.fn(() => 'test-pc-name')
}))

const { mockPublish, mockUnpublishAll, mockDestroy } = vi.hoisted(() => {
	return {
		mockPublish: vi.fn(),
		mockUnpublishAll: vi.fn(),
		mockDestroy: vi.fn()
	}
})

let mockBrowser: EventEmitter

vi.mock('bonjour-service', () => {
	return {
		Bonjour: class {
			publish = mockPublish

			find = vi.fn(() => {
				mockBrowser = new EventEmitter()
				return mockBrowser
			})

			unpublishAll = mockUnpublishAll
			destroy = mockDestroy
		}
	}
})

describe('Функция Discovery', () => {
	let consoleSpy: any

	beforeEach(() => {
		vi.clearAllMocks()
		consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		consoleSpy.mockRestore()
	})

	it('публикует сервис с переданными параметрами и портом по умолчанию', () => {
		Discovery('my-pc-123')

		expect(mockPublish).toHaveBeenCalledWith({
			name: 'Node-my-pc-123',
			type: 'Mes_Across_local',
			port: 3005,
			txt: {
				deviceId: 'my-pc-123',
				hostname: 'test-pc-name',
				appVersion: '1.0.0'
			}
		})
	})

	it('публикует сервис с кастомным портом', () => {
		Discovery('my-pc-123', 4000)
		expect(mockPublish).toHaveBeenCalledWith(
			expect.objectContaining({ port: 4000 })
		)
	})

	it('игнорирует событие "up", если устройство нашло само себя', () => {
		Discovery('my-pc-123')

		mockBrowser.emit('up', {
			txt: { deviceId: 'my-pc-123' }
		})

		expect(consoleSpy).not.toHaveBeenCalled()
	})

	it('выводит информацию при обнаружении чужого устройства', () => {
		Discovery('my-pc-123')

		mockBrowser.emit('up', {
			name: 'Node-other-pc-456',
			addresses: ['192.168.1.15'],
			port: 3005,
			txt: {
				deviceId: 'other-pc-456',
				appVersion: '1.0.0'
			}
		})

		expect(consoleSpy).toHaveBeenCalledWith('🟢 Найдено P2P-устройство!')
		expect(consoleSpy).toHaveBeenCalledWith('Имя: Node-other-pc-456')
		expect(consoleSpy).toHaveBeenCalledWith('IP-адрес: 192.168.1.15')
		expect(consoleSpy).toHaveBeenCalledWith('Порт: 3005')
	})

	it('корректно останавливает поиск и публикацию при вызове функции очистки', () => {
		const cleanup = Discovery('my-pc-123')

		cleanup()

		expect(mockUnpublishAll).toHaveBeenCalled()
		expect(mockDestroy).toHaveBeenCalled()
	})
})
