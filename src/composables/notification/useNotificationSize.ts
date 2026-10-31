import { onMounted } from 'vue'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { currentMonitor } from '@tauri-apps/api/window'
import { PhysicalPosition } from '@tauri-apps/api/dpi'

interface WindowPlacementOptions {
	margin?: number
	autoMove?: boolean
	showAfterMove?: boolean
}

export function useNotificationSize(options: WindowPlacementOptions = {}) {
	const { margin = 24, autoMove = true, showAfterMove = true } = options
	const currentWindow = getCurrentWebviewWindow()

	const moveToBottomRight = async () => {
		try {
			// Гарантируем скрытие из панели задач и поверх всех окон
			try {
				await currentWindow.setSkipTaskbar(true)
				await currentWindow.setAlwaysOnTop(true)
			} catch {}

			const monitor = await currentMonitor()

			if (monitor) {
				const windowSize = await currentWindow.outerSize()
				const scaledMargin = margin * monitor.scaleFactor

				const xPosition = monitor.size.width - windowSize.width - scaledMargin
				const yPosition = monitor.size.height - windowSize.height - scaledMargin

				await currentWindow.setPosition(
					new PhysicalPosition(xPosition, yPosition)
				)
			}

			if (showAfterMove) {
				await currentWindow.show()
			}
		} catch (error) {
			console.error('Ошибка позиционирования окна Tauri:', error)
		}
	}

	const hideWindow = async () => {
		try {
			await currentWindow.hide()
		} catch (error) {
			console.error('Ошибка при скрытии окна:', error)
		}
	}

	if (autoMove) {
		onMounted(async () => {
			await moveToBottomRight()
		})
	}

	return {
		moveToBottomRight,
		hideWindow
	}
}
