import { Bonjour } from 'bonjour-service'
import * as os from 'os'
import { connectToPeer } from './NetworkManager.js'

const bonjour = new Bonjour()
const SERVICE_TYPE = 'Mes_Across_local'
const appVersion = '1.0.0'

export function Discovery(myDeviceId: string, MY_PORT: number = 3005) {
	bonjour.publish({
		name: `Node-${myDeviceId}`,
		type: SERVICE_TYPE,
		port: MY_PORT,
		txt: {
			deviceId: myDeviceId,
			hostname: os.hostname(),
			appVersion: appVersion
		}
	})

	const browser = bonjour.find({ type: SERVICE_TYPE })

	browser.on('up', service => {
		if (service.txt?.deviceId === myDeviceId) return

		const targetIp = service.addresses?.[0]

		if (!targetIp) {
			console.log(
				`Найдено устройство ${service.name}, но у него нет валидного IP-адреса.`
			)
			return
		}

		const targetPort = service.port

		console.log('Найдено P2P-устройство!')
		console.log(`Имя: ${service.name}`)
		console.log(`IP-адрес: ${targetIp}`)
		console.log(`Порт: ${targetPort}`)
		console.log(`Метаданные:`, service.txt)

		connectToPeer(targetIp, targetPort, myDeviceId)
	})

	browser.on('down', service => {
		console.log(` Устройство отключилось: ${service.name}`)
	})

	return () => {
		bonjour.unpublishAll()
		bonjour.destroy()
	}
}
