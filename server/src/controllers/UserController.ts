import { UserDbService } from '../repositories/DeviceDiscoverer.js'
import { appServer } from '../api/AppServer.js'

export class UserController {
	constructor(
		private userDb: UserDbService,
		private myAccountId: string
	) {}

	// ==========================================
	// 1. ОБНАРУЖЕНИЕ (Вызывается из сети/Bonjour)
	// ==========================================

	async handleDiscoveredDevice(
		deviceId: string,
		remoteAccountId: string,
		ipAddress: string,
		typeDevice: 'phone' | 'pc' | 'laptop' | 'tablet' | 'other' = 'other'
	) {
		const initialStatus =
			this.myAccountId === remoteAccountId ? 'trusted' : 'pending'

		const device = await this.userDb.upsertDevice(
			deviceId,
			remoteAccountId,
			ipAddress,
			initialStatus,
			typeDevice
		)

		if (device?.status === 'pending') {
			// Отправляем запрос на фронтенд, чтобы показать модальное окно:
			// "Устройство X хочет подключиться. Разрешить?"
			appServer.notify('device:permission-request', { device })
		} else if (device?.status === 'trusted') {
			// Если устройство уже наше/доверенное, просто тихо обновляем статус UI
			appServer.notify('device:online', { device })
		}

		return device
	}

	// ==========================================
	// 2. УПРАВЛЕНИЕ ДОСТУПОМ (Вызывается из UI)
	// ==========================================

	async approveDevice(deviceId: string) {
		await this.userDb.updateDeviceStatus(deviceId, 'trusted')

		// Сообщаем фронтенду об успехе, чтобы скрыть модальное окно и обновить список
		appServer.notifySuccess(
			'Доступ разрешен',
			`Устройство ${deviceId} добавлено в доверенные`
		)
		appServer.notify('device:status-changed', { deviceId, status: 'trusted' })

		// Инициируем визуальную анимацию синхронизации
		appServer.notifySync('device', 'syncing', { targetDevice: deviceId })
	}

	async blockDevice(deviceId: string) {
		await this.userDb.updateDeviceStatus(deviceId, 'blocked')

		// Уведомляем интерфейс
		appServer.notifyError(
			'Доступ закрыт',
			`Устройство ${deviceId} заблокировано`
		)
		appServer.notify('device:status-changed', { deviceId, status: 'blocked' })

		// Здесь можно вызвать метод NetworkManager для принудительного разрыва соединения
	}

	// ==========================================
	// 3. МАРШРУТИЗАЦИЯ И ПРОВЕРКИ (Используется в других контроллерах)
	// ==========================================

	async isDeviceTrusted(deviceId: string): Promise<boolean> {
		const device = await this.userDb.getDevice(deviceId)

		// Если устройства нет в базе или оно заблокировано/в ожидании — отказ
		if (!device) return false
		return device.status === 'trusted'
	}

	async getAllTrustedDevices() {
		return await this.userDb.getDevicesByStatus('trusted')
	}
}
