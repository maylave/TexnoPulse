import { appServer } from "./AppServer.js";
import { notificationService } from "../services/NotificationService.js";

export function registerNotificationHandlers() {
  // Отправка уведомления от фронтенда или модулей
  appServer.register("notification:send", async (data) => {
    const success = await notificationService.send({
      title: data.title,
      body: data.body,
      type: data.type,
      sound: data.sound,
    });
    return { success };
  });

  // Тестовое уведомление из окна настроек
  appServer.register("notification:test", async () => {
    const success = await notificationService.send({
      title: "Snapi Messenger",
      body: "Тестовое уведомление: системные оповещения и звук работают отлично!",
      type: "system",
      sound: true,
    });
    return { success };
  });

  // Получить текущие настройки уведомлений
  appServer.register("settings:notifications:get", async () => {
    await notificationService.init();
    return notificationService.getSettings();
  });

  // Сохранить настройки уведомлений
  appServer.register("settings:notifications:update", async (data) => {
    await notificationService.updateSettings(data);
    return { success: true };
  });
}
