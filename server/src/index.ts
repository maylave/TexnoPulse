import cp from 'node:child_process'
import { startApp } from './app.js'
export { notificationService } from './services/NotificationService.js'

// Скрываем окно консоли, если процесс запущен напрямую на Windows в релизе
if (process.platform === 'win32' && process.env.NODE_ENV !== 'development' && !process.env.DEBUG) {
	try {
		const ps = 'Add-Type -Name Win -Namespace Native -MemberDefinition \'[DllImport("user32.dll")] public static extern bool ShowWindow(int hWnd, int nCmdShow); [DllImport("kernel32.dll")] public static extern int GetConsoleWindow();\'; [Native.Win]::ShowWindow([Native.Win]::GetConsoleWindow(), 0);'
		const encoded = Buffer.from(ps, 'utf16le').toString('base64')
		cp.spawn('powershell.exe', ['-NoProfile', '-EncodedCommand', encoded], {
			windowsHide: true,
			stdio: 'ignore'
		}).unref()
	} catch {}
}

startApp().catch(err => {
	console.error('[App] Критическая ошибка при старте:', err)
})
