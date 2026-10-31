import cp from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { db } from "../db/db.js";
import { SettingsChatTable } from "../db/sqema.js";
import { eq } from "drizzle-orm";
import { appServer } from "../api/AppServer.js";

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  startup: boolean;
  messages: boolean;
  devices: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  startup: true,
  messages: true,
  devices: true,
};

export interface NotificationPayload {
  title: string;
  body: string;
  type?: "startup" | "message" | "device" | "system";
  sound?: boolean;
}

class NotificationService {
  private settings: NotificationSettings = { ...defaultNotificationSettings };
  private initialized = false;
  private startupNotificationSent = false;

  async init() {
    if (this.initialized) return;
    try {
      const rows = await db
        .select()
        .from(SettingsChatTable)
        .where(eq(SettingsChatTable.id, "app_notifications_settings"));
      if (rows.length > 0 && rows[0].settings) {
        const stored = typeof rows[0].settings === "string"
          ? JSON.parse(rows[0].settings)
          : rows[0].settings;
        this.settings = {
          ...defaultNotificationSettings,
          ...stored,
        };
      }
    } catch (e) {
      console.warn("[NotificationService] Ошибка чтения настроек из БД:", e);
    }
    this.initialized = true;
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<NotificationSettings>) {
    await this.init();
    this.settings = { ...this.settings, ...updates };
    try {
      await db
        .insert(SettingsChatTable)
        .values({
          id: "app_notifications_settings",
          name: "Настройки уведомлений",
          settings: this.settings as any,
        })
        .onConflictDoUpdate({
          target: SettingsChatTable.id,
          set: {
            settings: this.settings as any,
          },
        });
      console.log("[NotificationService] Настройки обновлены:", this.settings);
    } catch (e) {
      console.warn("[NotificationService] Ошибка сохранения настроек:", e);
    }
  }

  private findTauriAppBinary(): string | null {
    const candidates = [
      // 1. Рядом с текущим процессом (когда запускается в собранном приложении)
      path.join(path.dirname(process.execPath), "Snapi.exe"),
      path.join(path.dirname(process.execPath), "snapi-app.exe"),
      path.join(process.cwd(), "Snapi.exe"),
      path.join(process.cwd(), "snapi-app.exe"),
      // 2. Сборка из текущего проекта (target/release или target/debug)
      "C:\\Users\\Mi\\snapi-app\\src-tauri\\target\\release\\snapi-app.exe",
      path.resolve(process.cwd(), "src-tauri/target/release/snapi-app.exe"),
      path.resolve(process.cwd(), "../src-tauri/target/release/snapi-app.exe"),
      "C:\\Users\\Mi\\snapi-app\\src-tauri\\target\\debug\\snapi-app.exe",
      path.resolve(process.cwd(), "src-tauri/target/debug/snapi-app.exe"),
      path.resolve(process.cwd(), "../src-tauri/target/debug/snapi-app.exe"),
      // 3. Стандартные установленные папки
      "C:\\Program Files\\Snapi\\Snapi.exe",
      "C:\\Program Files\\Snapi\\snapi-app.exe",
      path.join(process.env.LOCALAPPDATA || "", "Programs\\Snapi\\Snapi.exe"),
      path.join(process.env.LOCALAPPDATA || "", "Programs\\Snapi\\snapi-app.exe"),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return c;
      }
    }
    return null;
  }

  private playNotificationSound() {
    if (process.platform !== "win32") return;
    try {
      const proc = cp.spawn("powershell.exe", [
        "-NoProfile",
        "-Command",
        "[System.Media.SystemSounds]::Asterisk.Play()"
      ], {
        windowsHide: true,
        stdio: "ignore",
        detached: true,
      });
      proc.unref();
    } catch {}
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    await this.init();

    // 1. Проверяем глобальный переключатель уведомлений
    if (!this.settings.enabled) {
      console.log(`[NotificationService] Уведомления отключены пользователем, пропуск: ${payload.title}`);
      return false;
    }

    // 2. Проверяем переключатель по конкретному типу
    if (payload.type === "startup" && !this.settings.startup) {
      console.log("[NotificationService] Уведомления о запуске отключены");
      return false;
    }
    if (payload.type === "message" && !this.settings.messages) {
      console.log("[NotificationService] Уведомления о сообщениях отключены");
      return false;
    }
    if (payload.type === "device" && !this.settings.devices) {
      console.log("[NotificationService] Уведомления об устройствах отключены");
      return false;
    }

    const playSound = payload.sound !== undefined ? payload.sound : this.settings.sound;
    if (playSound) {
      this.playNotificationSound();
    }

    // 3. Проверяем: запущен ли клиент WebSocket (Tauri окно / браузер)
    const clientCount = appServer.getClientCount();

    if (clientCount > 0) {
      // Фронтенд или окно уведомления уже открыто — отправляем событие напрямую в Vue окно
      console.log(`[NotificationService] Отправка уведомления через открытый WebSocket (${clientCount} клиентов)`);
      appServer.notify("notification:custom", {
        title: payload.title,
        body: payload.body,
        type: payload.type || "system",
      });
    } else {
      // Tauri НЕ был запущен — вызываем кастомное окно через бинарник Tauri в режиме --notification
      const tauriBin = this.findTauriAppBinary();
      if (tauriBin) {
        console.log(`[NotificationService] Tauri не открыт, запускаем кастомное окно уведомления: ${tauriBin}`);
        try {
          const child = cp.spawn(
            tauriBin,
            [
              "--notification",
              `--title=${payload.title}`,
              `--body=${payload.body}`,
              `--type=${payload.type || "system"}`,
            ],
            {
              detached: true,
              stdio: "ignore",
              windowsHide: true,
            }
          );
          child.unref();
        } catch (err) {
          console.error("[NotificationService] Не удалось запустить окно Tauri:", err);
          this.sendNativeWindowsToast(payload.title, payload.body, false);
        }
      } else {
        // Резервный вариант: если бинарник приложения еще ни разу не скомпилирован
        console.warn("[NotificationService] Бинарник Tauri не найден, отправляем нативный тост");
        this.sendNativeWindowsToast(payload.title, payload.body, false);
      }
    }

    // Оповещаем подписчиков общего канала
    appServer.notify("app:success", {
      action: "notification",
      message: `${payload.title}: ${payload.body}`,
    });

    return true;
  }

  async sendStartupNotification() {
    if (this.startupNotificationSent) return;
    this.startupNotificationSent = true;
    await this.init();

    if (!this.settings.enabled || !this.settings.startup) {
      return;
    }

    setTimeout(() => {
      this.send({
        title: "Snapi Messenger",
        body: "Сервис запущен и готов к работе в фоновом режиме!",
        type: "startup",
      });
    }, 1200);
  }

  private sendNativeWindowsToast(title: string, body: string, sound: boolean) {
    if (process.platform !== "win32") {
      console.log(`[Notification] ${title}: ${body}`);
      return;
    }

    const safeTitle = (title || "Snapi").replace(/'/g, "''");
    const safeBody = (body || "").replace(/'/g, "''");

    const psScript = `
try {
  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
  $textNodes = $template.GetElementsByTagName('text')
  $textNodes.Item(0).InnerText = '${safeTitle}'
  $textNodes.Item(1).InnerText = '${safeBody}'

  $audio = $template.CreateElement('audio')
  ${sound 
    ? `$audio.SetAttribute('src', 'ms-winsoundevent:Notification.Default')` 
    : `$audio.SetAttribute('silent', 'true')`}
  $template.DocumentElement.AppendChild($audio) | Out-Null

  $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
  $appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe'
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
} catch {}
`;

    try {
      const base64 = Buffer.from(psScript, "utf16le").toString("base64");
      const proc = cp.spawn("powershell.exe", ["-NoProfile", "-EncodedCommand", base64], {
        windowsHide: true,
        stdio: "ignore",
        detached: true,
      });
      proc.unref();
    } catch (e) {
      console.warn("[NotificationService] Не удалось вызвать powershell toast:", e);
    }
  }
}

export const notificationService = new NotificationService();
